import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { EvidenceSettings } from '../config/settings';

/** Minimal blob surface the evidence service needs. Keys use `/` separators. */
export interface ObjectBackend {
  readonly name: string;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | undefined>;
  list(prefix: string): Promise<string[]>;
}

export class MemoryBackend implements ObjectBackend {
  readonly name = 'memory';
  private readonly blobs = new Map<string, Buffer>();

  put(key: string, body: Buffer): Promise<void> {
    this.blobs.set(key, Buffer.from(body));
    return Promise.resolve();
  }

  get(key: string): Promise<Buffer | undefined> {
    return Promise.resolve(this.blobs.get(key));
  }

  list(prefix: string): Promise<string[]> {
    return Promise.resolve(
      [...this.blobs.keys()].filter((k) => k.startsWith(prefix)),
    );
  }
}

export class FsBackend implements ObjectBackend {
  readonly name = 'fs';
  private readonly root: string;

  constructor(root: string, bucket: string) {
    this.root = path.join(root, bucket);
  }

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) {
      throw new Error(`key escapes store root: ${key}`);
    }
    return full;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const file = this.resolve(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
  }

  async get(key: string): Promise<Buffer | undefined> {
    try {
      return await fs.readFile(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw err;
    }
  }

  async list(prefix: string): Promise<string[]> {
    const out: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
        throw err;
      }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else out.push(path.relative(this.root, full).split(path.sep).join('/'));
      }
    };
    await walk(this.root);
    return out.filter((k) => k.startsWith(prefix));
  }
}

type MinioClient = {
  bucketExists(bucket: string): Promise<boolean>;
  makeBucket(bucket: string, region?: string): Promise<void>;
  putObject(
    bucket: string,
    key: string,
    body: Buffer,
    size: number,
    meta?: Record<string, string>,
  ): Promise<unknown>;
  getObject(bucket: string, key: string): Promise<NodeJS.ReadableStream>;
  listObjectsV2(
    bucket: string,
    prefix: string,
    recursive: boolean,
  ): NodeJS.ReadableStream;
};

export class MinioBackend implements ObjectBackend {
  readonly name = 'minio';
  private client: MinioClient | null = null;
  private ensured = false;

  constructor(private readonly s: EvidenceSettings) {}

  private async getClient(): Promise<MinioClient> {
    if (this.client) return this.client;
    const mod = (await import('minio')) as unknown as {
      Client: new (opts: Record<string, unknown>) => MinioClient;
    };
    const url = new URL(this.s.endpoint);
    const useSSL = this.s.useSSL || url.protocol === 'https:';
    this.client = new mod.Client({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : useSSL ? 443 : 80,
      useSSL,
      accessKey: this.s.accessKey,
      secretKey: this.s.secretKey,
      region: this.s.region,
    });
    return this.client;
  }

  private async ready(): Promise<MinioClient> {
    const c = await this.getClient();
    if (!this.ensured) {
      if (!(await c.bucketExists(this.s.bucket))) {
        await c.makeBucket(this.s.bucket, this.s.region);
      }
      this.ensured = true;
    }
    return c;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const c = await this.ready();
    await c.putObject(this.s.bucket, key, body, body.length, {
      'Content-Type': contentType,
    });
  }

  async get(key: string): Promise<Buffer | undefined> {
    const c = await this.ready();
    let stream: NodeJS.ReadableStream;
    try {
      stream = await c.getObject(this.s.bucket, key);
    } catch (err) {
      if ((err as { code?: string }).code === 'NoSuchKey') return undefined;
      throw err;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async list(prefix: string): Promise<string[]> {
    const c = await this.ready();
    const stream = c.listObjectsV2(this.s.bucket, prefix, true);
    const keys: string[] = [];
    for await (const item of stream) {
      const name = (item as { name?: string }).name;
      if (name) keys.push(name);
    }
    return keys;
  }
}

export function createBackend(s: EvidenceSettings): ObjectBackend {
  switch (s.backend) {
    case 'memory':
      return new MemoryBackend();
    case 'fs':
      return new FsBackend(s.fsRoot, s.bucket);
    case 'minio':
      return new MinioBackend(s);
  }
}
