import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GatewaySettings } from './config.js';
import type { GatewaySession, RegisterSessionInput, StreamProtocol } from './types.js';
import { assertPullUrl, buildPullUrl, normalizeStreamPath } from './urls.js';

export class SessionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionValidationError';
  }
}

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`session not found: ${id}`);
    this.name = 'SessionNotFoundError';
  }
}

function isProtocol(v: unknown): v is StreamProtocol {
  return v === 'rtsp' || v === 'rtmp';
}

function sessionFile(dir: string, id: string): string {
  return path.join(dir, `${id}.json`);
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export class FileSessionRegistry {
  constructor(private readonly settings: GatewaySettings) {}

  async register(input: RegisterSessionInput): Promise<GatewaySession> {
    const name = (input.name ?? '').trim();
    if (!name) {
      throw new SessionValidationError('name is required');
    }
    if (!isProtocol(input.protocol)) {
      throw new SessionValidationError('protocol must be rtsp or rtmp');
    }

    let streamPath: string;
    let pullUrl: string;
    if (input.url) {
      pullUrl = assertPullUrl(input.protocol, input.url);
      streamPath = input.path ? normalizeStreamPath(input.path) : derivePathFromUrl(pullUrl);
    } else {
      if (!input.path) {
        throw new SessionValidationError('path is required when url is omitted');
      }
      streamPath = normalizeStreamPath(input.path);
      pullUrl = buildPullUrl(this.settings, input.protocol, streamPath);
    }

    const now = new Date().toISOString();
    const session: GatewaySession = {
      id: randomUUID(),
      name,
      protocol: input.protocol,
      path: streamPath,
      pullUrl,
      status: 'registered',
      createdAt: now,
      updatedAt: now,
    };

    await ensureDir(this.settings.sessionDir);
    await writeFile(sessionFile(this.settings.sessionDir, session.id), JSON.stringify(session, null, 2), 'utf8');
    return session;
  }

  async get(id: string): Promise<GatewaySession> {
    try {
      const raw = await readFile(sessionFile(this.settings.sessionDir, id), 'utf8');
      return JSON.parse(raw) as GatewaySession;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new SessionNotFoundError(id);
      }
      throw err;
    }
  }

  /** Register a pull URL once; returns existing session when the URL is already known. */
  async registerPullUrl(url: string): Promise<{ session: GatewaySession; created: boolean }> {
    const existing = (await this.list()).find((s) => s.pullUrl === url);
    if (existing) {
      return { session: existing, created: false };
    }
    const protocol = url.toLowerCase().startsWith('rtmp://') ? 'rtmp' : 'rtsp';
    const streamPath = derivePathFromUrl(url);
    const session = await this.register({
      name: streamPath.replace(/\//g, '-'),
      protocol,
      url,
    });
    return { session, created: true };
  }

  async list(): Promise<GatewaySession[]> {
    await ensureDir(this.settings.sessionDir);
    const entries = await readdir(this.settings.sessionDir);
    const sessions: GatewaySession[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const raw = await readFile(path.join(this.settings.sessionDir, entry), 'utf8');
      sessions.push(JSON.parse(raw) as GatewaySession);
    }
    sessions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sessions;
  }
}

function derivePathFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    return p || 'live/unnamed';
  } catch {
    return 'live/unnamed';
  }
}
