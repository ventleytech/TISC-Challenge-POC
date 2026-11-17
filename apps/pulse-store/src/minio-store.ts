import type { StoreSettings } from './config.js';
import type { GetResult, ObjectStore, PutResult } from './types.js';

type MinioClient = {
  bucketExists: (bucket: string) => Promise<boolean>;
  makeBucket: (bucket: string, region?: string) => Promise<void>;
  putObject: (
    bucket: string,
    key: string,
    body: Buffer | string,
    size?: number,
    meta?: Record<string, string>,
  ) => Promise<{ etag?: string; versionId?: string | null }>;
  getObject: (bucket: string, key: string) => Promise<NodeJS.ReadableStream>;
  statObject: (bucket: string, key: string) => Promise<unknown>;
};

function parseEndpoint(endpoint: string): { endPoint: string; port: number; useSSL: boolean } {
  const url = new URL(endpoint);
  const useSSL = url.protocol === 'https:';
  const port = url.port ? Number(url.port) : useSSL ? 443 : 80;
  return { endPoint: url.hostname, port, useSSL };
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export class MinioObjectStore implements ObjectStore {
  readonly backend = 'minio' as const;
  private client: MinioClient | null = null;
  private ensuredBucket = false;

  constructor(private readonly settings: StoreSettings) {}

  private async getClient(): Promise<MinioClient> {
    if (this.client) return this.client;
    let minioMod: { Client: new (opts: Record<string, unknown>) => MinioClient };
    try {
      minioMod = (await import('minio')) as unknown as {
        Client: new (opts: Record<string, unknown>) => MinioClient;
      };
    } catch (err) {
      throw new Error(
        `minio package unavailable — install optionalDependency or use PULSE_STORE_BACKEND=fs (${String(err)})`,
      );
    }
    const parsed = parseEndpoint(this.settings.endpoint);
    this.client = new minioMod.Client({
      endPoint: parsed.endPoint,
      port: parsed.port,
      useSSL: this.settings.useSSL || parsed.useSSL,
      accessKey: this.settings.accessKey,
      secretKey: this.settings.secretKey,
      region: this.settings.region,
    });
    return this.client;
  }

  private async ensureBucket(client: MinioClient): Promise<void> {
    if (this.ensuredBucket) return;
    const exists = await client.bucketExists(this.settings.bucket);
    if (!exists) {
      await client.makeBucket(this.settings.bucket, this.settings.region);
    }
    this.ensuredBucket = true;
  }

  async put(key: string, body: Buffer | string, contentType?: string): Promise<PutResult> {
    const client = await this.getClient();
    await this.ensureBucket(client);
    const buf = typeof body === 'string' ? Buffer.from(body) : body;
    const meta = contentType ? { 'Content-Type': contentType } : undefined;
    const result = await client.putObject(
      this.settings.bucket,
      key,
      buf,
      buf.length,
      meta,
    );
    return { key, etag: result.etag, backend: this.backend };
  }

  async get(key: string): Promise<GetResult> {
    const client = await this.getClient();
    try {
      const stream = await client.getObject(this.settings.bucket, key);
      const body = await streamToBuffer(stream);
      return { key, body, backend: this.backend };
    } catch (err) {
      throw new Error(`object not found or MinIO error for ${key}: ${String(err)}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient();
    try {
      await client.statObject(this.settings.bucket, key);
      return true;
    } catch {
      return false;
    }
  }
}
