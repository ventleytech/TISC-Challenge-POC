import { randomBytes } from 'node:crypto';
import * as path from 'node:path';
import { isEnergyRole, type EnergyRole } from '../auth/roles';
import type { AuthPrincipal } from '../auth/principal';

export type PulseApiSettings = {
  port: number;
  openapiPath: string;
  openapiUrlPath: string;
  swaggerPath: string;
  /** When true, AuthGuard rejects unauthenticated /api/v1 traffic. */
  authEnabled: boolean;
  /** Map of API key / bearer token → principal (dev stub). */
  authPrincipals: Map<string, AuthPrincipal>;
  /**
   * Postgres connection URL for inspections/assets/alerts.
   * Unset → MemoryStore (tests / no-DB local).
   */
  databaseUrl: string | null;
  /** Kafka ingest of vp.findings.v1 / vp.alerts.v1 (P0-T330). Omitted in unit fixtures. */
  kafka?: KafkaIngestSettings;
  /** Evidence crops → object store (P0-T350). Omitted in unit fixtures → memory backend. */
  evidence?: EvidenceSettings;
  /** Browser origins allowed by CORS (PULSE_API_CORS_ORIGINS, comma-separated). Empty → CORS off. */
  corsOrigins?: string[];
};

export type EvidenceBackend = 'memory' | 'fs' | 'minio';

export type EvidenceSettings = {
  backend: EvidenceBackend;
  /** MinIO / S3 endpoint (PULSE_STORE_ENDPOINT). Used when backend=minio. */
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  useSSL: boolean;
  /** Root dir for backend=fs. */
  fsRoot: string;
  /** HMAC secret for signed content URLs (PULSE_EVIDENCE_SIGNING_SECRET). */
  signingSecret: string;
  /** True when secret was generated per-process (links die on restart). */
  signingSecretEphemeral: boolean;
  urlTtlSeconds: number;
  maxBytes: number;
};

export type KafkaIngestSettings = {
  /** Consumer runs only when true AND bootstrap is non-empty. */
  enabled: boolean;
  bootstrap: string;
  groupId: string;
  clientId: string;
  findingsTopic: string;
  alertsTopic: string;
  /**
   * Fallback tenant for finding events (vp.findings.v1 carries no utility_id).
   * Resolution order: inspection row -> this default -> reject.
   */
  defaultUtilityId: string | null;
  /** Dead-letter sink for skipped messages (P0-T391). Off by default. */
  dlq: DlqSettings;
};

export type DlqSettings = {
  enabled: boolean;
  /** Kafka topic used when `file` is empty. */
  topic: string;
  /** If set, append JSONL here instead of producing to Kafka. */
  file: string;
};

/**
 * Load pulse-api settings from env. Ports/hosts come from .env.template keys
 * (PULSE_API_PORT). OpenAPI defaults to packages/contracts — override via
 * PULSE_OPENAPI_PATH when the process cwd layout differs.
 *
 * Auth stub (C10 / S5):
 * - PULSE_AUTH_ENABLED=true|false (default true)
 * - PULSE_AUTH_STUB_KEYS=key:role:utility_id;key2:role:utility_id
 *   Empty utility_id allowed only for platform_admin.
 */
export function loadSettings(
  env: NodeJS.ProcessEnv = process.env,
): PulseApiSettings {
  const portRaw = env.PULSE_API_PORT ?? '3000';
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PULSE_API_PORT: ${portRaw}`);
  }

  const defaultOpenApi = path.resolve(
    __dirname,
    '../../../../packages/contracts/openapi/openapi.yaml',
  );

  const authEnabled = parseBool(env.PULSE_AUTH_ENABLED, true);
  const authPrincipals = parseStubKeys(env.PULSE_AUTH_STUB_KEYS ?? '');

  const databaseUrlRaw = env.PULSE_DATABASE_URL?.trim() ?? '';
  const databaseUrl = databaseUrlRaw.length > 0 ? databaseUrlRaw : null;

  return {
    port,
    openapiPath: env.PULSE_OPENAPI_PATH ?? defaultOpenApi,
    openapiUrlPath: '/api/openapi.yaml',
    swaggerPath: '/api/docs',
    authEnabled,
    authPrincipals,
    databaseUrl,
    kafka: {
      enabled: parseBool(env.PULSE_KAFKA_CONSUMER_ENABLED, false),
      bootstrap: env.PULSE_KAFKA_BOOTSTRAP?.trim() ?? '',
      groupId: env.PULSE_KAFKA_GROUP_ID?.trim() || 'pulse-api',
      clientId: env.PULSE_KAFKA_CLIENT_ID?.trim() || 'pulse-api',
      findingsTopic: env.PULSE_KAFKA_TOPIC_FINDINGS?.trim() || 'vp.findings.v1',
      alertsTopic: env.PULSE_KAFKA_TOPIC_ALERTS?.trim() || 'vp.alerts.v1',
      defaultUtilityId: env.PULSE_KAFKA_DEFAULT_UTILITY_ID?.trim() || null,
      dlq: {
        enabled: parseBool(env.PULSE_KAFKA_DLQ_ENABLED, false),
        topic: env.PULSE_KAFKA_DLQ_TOPIC?.trim() || 'vp.dlq.v1',
        file: env.PULSE_KAFKA_DLQ_FILE?.trim() ?? '',
      },
    },
    evidence: loadEvidenceSettings(env),
    corsOrigins: (env.PULSE_API_CORS_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  };
}

/**
 * Evidence store config. Reuses the pulse-store env keys from .env.template
 * (PULSE_STORE_*); unset backend → memory (tests / no-store local).
 */
export function loadEvidenceSettings(
  env: NodeJS.ProcessEnv = process.env,
): EvidenceSettings {
  const backendRaw = (env.PULSE_STORE_BACKEND ?? 'memory').trim().toLowerCase();
  if (!['memory', 'fs', 'minio'].includes(backendRaw)) {
    throw new Error(
      `Invalid PULSE_STORE_BACKEND: ${backendRaw} (use memory|fs|minio)`,
    );
  }
  const endpoint = env.PULSE_STORE_ENDPOINT?.trim() || 'http://127.0.0.1:9000';
  const ttl = Number(env.PULSE_EVIDENCE_URL_TTL_SECONDS ?? '300');
  const maxBytes = Number(
    env.PULSE_EVIDENCE_MAX_BYTES ?? String(5 * 1024 * 1024),
  );
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error(
      `Invalid PULSE_EVIDENCE_URL_TTL_SECONDS: ${env.PULSE_EVIDENCE_URL_TTL_SECONDS}`,
    );
  }
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error(
      `Invalid PULSE_EVIDENCE_MAX_BYTES: ${env.PULSE_EVIDENCE_MAX_BYTES}`,
    );
  }
  const secretRaw = env.PULSE_EVIDENCE_SIGNING_SECRET?.trim() ?? '';
  return {
    backend: backendRaw as EvidenceBackend,
    endpoint,
    bucket: env.PULSE_STORE_BUCKET?.trim() || 'voltpulse-evidence',
    accessKey: env.PULSE_STORE_ACCESS_KEY?.trim() || 'minioadmin',
    secretKey: env.PULSE_STORE_SECRET_KEY?.trim() || 'change-me-local-only',
    region: env.PULSE_STORE_REGION?.trim() || 'us-east-1',
    useSSL: parseBool(env.PULSE_STORE_USE_SSL, endpoint.startsWith('https://')),
    fsRoot: path.resolve(
      env.PULSE_STORE_FS_ROOT?.trim() || './.pulse-store-data',
    ),
    signingSecret: secretRaw || randomBytes(32).toString('hex'),
    signingSecretEphemeral: secretRaw.length === 0,
    urlTtlSeconds: ttl,
    maxBytes,
  };
}

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  throw new Error(`Invalid boolean env value: ${raw}`);
}

/**
 * Parse `key:role:utility_id` entries separated by `;` or newlines.
 * Trailing empty utility → null (platform_admin only).
 */
export function parseStubKeys(raw: string): Map<string, AuthPrincipal> {
  const map = new Map<string, AuthPrincipal>();
  const chunks = raw
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const parts = chunk.split(':');
    if (parts.length < 2) {
      throw new Error(
        `Invalid PULSE_AUTH_STUB_KEYS entry (want key:role:utility_id): ${chunk}`,
      );
    }
    const key = parts[0]?.trim();
    const roleRaw = parts[1]?.trim();
    const utilityId = parts.slice(2).join(':').trim(); // allow colons in id edge case
    if (!key || !roleRaw) {
      throw new Error(`Invalid PULSE_AUTH_STUB_KEYS entry: ${chunk}`);
    }
    if (!isEnergyRole(roleRaw)) {
      throw new Error(`Unknown Energy role in stub keys: ${roleRaw}`);
    }
    const role: EnergyRole = roleRaw;
    if (!utilityId && role !== 'platform_admin') {
      throw new Error(`Stub key ${key}: utility_id required for role ${role}`);
    }
    if (utilityId && role === 'platform_admin') {
      // platform may optionally bind a home utility; still cross-scope
    }
    map.set(key, {
      keyId: key,
      role,
      utilityId: utilityId || null,
    });
  }
  return map;
}
