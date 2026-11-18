import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PULSE_API_SETTINGS } from '../config/settings.module';
import type { EvidenceSettings, PulseApiSettings } from '../config/settings';
import { DETECTION_CLASSES } from '../domain/types';
import { createBackend, type ObjectBackend } from './object-backend';
import {
  EVIDENCE_CONTENT_TYPES,
  EVIDENCE_KINDS,
  type EvidenceCreate,
  type EvidenceMeta,
  type EvidenceObject,
} from './evidence.types';

const META_SUFFIX = '.meta.json';
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
};
const SEGMENT = /^[a-zA-Z0-9._-]+$/;

export type EvidenceFilter = {
  utilityId: string;
  inspectionId?: string;
  findingId?: string;
  kind?: string;
};

/** Fallback settings when a unit fixture omits `evidence` → memory backend. */
const FIXTURE_SETTINGS: EvidenceSettings = {
  backend: 'memory',
  endpoint: 'http://127.0.0.1:9000',
  bucket: 'voltpulse-evidence',
  accessKey: 'fixture',
  secretKey: 'fixture',
  region: 'us-east-1',
  useSSL: false,
  fsRoot: '/tmp/vp-evidence-fixture',
  signingSecret: 'fixture-secret',
  signingSecretEphemeral: false,
  urlTtlSeconds: 300,
  maxBytes: 5 * 1024 * 1024,
};

@Injectable()
export class EvidenceService {
  private readonly log = new Logger('EvidenceService');
  private readonly cfg: EvidenceSettings;
  private readonly backend: ObjectBackend;
  // ponytail: single-process index warmed from `*.meta.json` sidecars on first
  // use; a second pulse-api replica would not see the other's writes until
  // restart. Upgrade: evidence table in DomainStore (Postgres).
  private index: Map<string, EvidenceMeta> | null = null;

  constructor(@Inject(PULSE_API_SETTINGS) settings: PulseApiSettings) {
    this.cfg = settings.evidence ?? FIXTURE_SETTINGS;
    this.backend = createBackend(this.cfg);
    if (this.cfg.signingSecretEphemeral) {
      this.log.warn(
        'PULSE_EVIDENCE_SIGNING_SECRET unset — signed URLs die on restart',
      );
    }
    this.log.log(
      `evidence backend=${this.backend.name} bucket=${this.cfg.bucket}`,
    );
  }

  get backendName(): string {
    return this.backend.name;
  }

  private async warm(): Promise<Map<string, EvidenceMeta>> {
    if (this.index) return this.index;
    const map = new Map<string, EvidenceMeta>();
    const keys = (await this.backend.list('')).filter((k) =>
      k.endsWith(META_SUFFIX),
    );
    for (const k of keys) {
      const raw = await this.backend.get(k);
      if (!raw) continue;
      const meta = JSON.parse(raw.toString('utf8')) as EvidenceMeta;
      map.set(meta.id, meta);
    }
    this.index = map;
    return map;
  }

  async create(body: EvidenceCreate): Promise<EvidenceMeta> {
    const bad = (msg: string): never => {
      throw new BadRequestException(msg);
    };
    if (!body?.utility_id || !SEGMENT.test(body.utility_id)) {
      bad('utility_id required (alphanumeric ._-)');
    }
    if (!body.inspection_id || !SEGMENT.test(body.inspection_id)) {
      bad('inspection_id required (alphanumeric ._-)');
    }
    if (!EVIDENCE_KINDS.includes(body.kind)) bad(`invalid kind: ${body.kind}`);
    if (
      !(EVIDENCE_CONTENT_TYPES as readonly string[]).includes(body.content_type)
    ) {
      bad(`unsupported content_type: ${body.content_type}`);
    }
    if (body.class_id != null && !DETECTION_CLASSES.includes(body.class_id)) {
      bad(`invalid class_id: ${body.class_id}`);
    }
    if (
      body.confidence != null &&
      !(
        typeof body.confidence === 'number' &&
        body.confidence >= 0 &&
        body.confidence <= 1
      )
    ) {
      bad('confidence must be a number in [0,1]');
    }
    if (
      body.bbox != null &&
      !(
        Array.isArray(body.bbox) &&
        body.bbox.length === 4 &&
        body.bbox.every((n) => Number.isFinite(n))
      )
    ) {
      bad('bbox must be [x,y,w,h] numbers');
    }
    if (typeof body.data_base64 !== 'string' || body.data_base64.length === 0) {
      bad('data_base64 required');
    }
    const bytes = Buffer.from(body.data_base64, 'base64');
    if (bytes.length === 0) bad('data_base64 decoded to 0 bytes');
    if (bytes.length > this.cfg.maxBytes) {
      bad(`evidence exceeds PULSE_EVIDENCE_MAX_BYTES (${this.cfg.maxBytes})`);
    }
    const captured = body.captured_at ? new Date(body.captured_at) : new Date();
    if (Number.isNaN(captured.getTime())) bad('captured_at must be ISO-8601');

    // id salted with inspection so identical bytes in two inspections never collide.
    const digest = createHash('sha256')
      .update(`${body.inspection_id}\0`)
      .update(bytes)
      .digest('hex')
      .slice(0, 12);
    const id = `ev_${digest}`;
    // Layout: docs/storage-retention.md {utility}/insp_{id}/evidence/ev_{sha12}.{ext}
    const objectKey = `${body.utility_id}/insp_${body.inspection_id}/evidence/${id}.${EXT_BY_TYPE[body.content_type]}`;

    const meta: EvidenceMeta = {
      id,
      utility_id: body.utility_id,
      inspection_id: body.inspection_id,
      finding_id: body.finding_id ?? null,
      asset_id: body.asset_id ?? null,
      kind: body.kind,
      class_id: body.class_id ?? null,
      confidence: body.confidence ?? null,
      bbox: body.bbox ?? null,
      label: body.label?.toString().slice(0, 120) || null,
      content_type: body.content_type,
      bytes: bytes.length,
      retention: 'hot',
      captured_at: captured.toISOString(),
      created_at: new Date().toISOString(),
      object_key: objectKey,
    };
    await this.backend.put(objectKey, bytes, body.content_type);
    await this.backend.put(
      objectKey + META_SUFFIX,
      Buffer.from(JSON.stringify(meta)),
      'application/json',
    );
    (await this.warm()).set(id, meta);
    return meta;
  }

  async list(f: EvidenceFilter): Promise<EvidenceObject[]> {
    const rows = [...(await this.warm()).values()]
      .filter((m) => m.utility_id === f.utilityId)
      .filter((m) => !f.inspectionId || m.inspection_id === f.inspectionId)
      .filter((m) => !f.findingId || m.finding_id === f.findingId)
      .filter((m) => !f.kind || m.kind === f.kind)
      .sort((a, b) =>
        a.captured_at === b.captured_at
          ? a.id.localeCompare(b.id)
          : b.captured_at.localeCompare(a.captured_at),
      );
    return rows.map((m) => this.view(m));
  }

  async getMeta(id: string): Promise<EvidenceMeta> {
    const meta = (await this.warm()).get(id);
    if (!meta) throw new NotFoundException(`evidence ${id} not found`);
    return meta;
  }

  async getView(id: string): Promise<EvidenceObject> {
    return this.view(await this.getMeta(id));
  }

  /** Verifies HMAC + expiry, then returns bytes. No API key needed (img tags). */
  async readSigned(
    id: string,
    exp: string | undefined,
    sig: string | undefined,
  ): Promise<{ body: Buffer; contentType: string }> {
    const expN = Number(exp);
    if (!exp || !sig || !Number.isFinite(expN)) {
      throw new UnauthorizedException('signed url required (exp, sig)');
    }
    if (expN < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('signed url expired');
    }
    const want = Buffer.from(this.sign(id, expN), 'hex');
    const got = Buffer.from(sig, 'hex');
    if (want.length !== got.length || !timingSafeEqual(want, got)) {
      throw new UnauthorizedException('signed url invalid');
    }
    const meta = await this.getMeta(id);
    const body = await this.backend.get(meta.object_key);
    if (!body) throw new NotFoundException(`evidence ${id} object missing`);
    return { body, contentType: meta.content_type };
  }

  private sign(id: string, exp: number): string {
    return createHmac('sha256', this.cfg.signingSecret)
      .update(`${id}.${exp}`)
      .digest('hex');
  }

  private view(meta: EvidenceMeta): EvidenceObject {
    const exp = Math.floor(Date.now() / 1000) + this.cfg.urlTtlSeconds;
    return {
      ...meta,
      backend: this.backend.name,
      content_path: `/evidence/${meta.id}/content?exp=${exp}&sig=${this.sign(meta.id, exp)}`,
      content_expires_at: new Date(exp * 1000).toISOString(),
    };
  }
}
