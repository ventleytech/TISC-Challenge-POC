import fs from 'node:fs/promises';
import path from 'node:path';
import type { GetResult, ObjectStore, PutResult } from './types.js';

export class FsObjectStore implements ObjectStore {
  readonly backend = 'fs' as const;

  constructor(
    private readonly root: string,
    private readonly bucket: string,
  ) {}

  private resolveKey(key: string): string {
    const normalized = key.replace(/^\/+/, '');
    if (!normalized || normalized.includes('..')) {
      throw new Error(`invalid object key: ${key}`);
    }
    return path.join(this.root, this.bucket, ...normalized.split('/'));
  }

  async put(key: string, body: Buffer | string, _contentType?: string): Promise<PutResult> {
    const dest = this.resolveKey(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const buf = typeof body === 'string' ? Buffer.from(body) : body;
    await fs.writeFile(dest, buf);
    return { key, backend: this.backend };
  }

  async get(key: string): Promise<GetResult> {
    const dest = this.resolveKey(key);
    try {
      const body = await fs.readFile(dest);
      return { key, body, backend: this.backend };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new Error(`object not found: ${key}`);
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const dest = this.resolveKey(key);
    try {
      await fs.unlink(dest);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new Error(`object not found: ${key}`);
      }
      throw err;
    }
  }
}
