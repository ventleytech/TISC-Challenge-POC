import fs from 'node:fs/promises';
import path from 'node:path';

export interface ObjectMeta {
  key: string;
  createdAt: string; // ISO-8601
  legalHold: boolean;
}

/** Local JSON index — POC meta plane (works with fs or MinIO object body). */
export class MetaIndex {
  private cache: Map<string, ObjectMeta> | null = null;

  constructor(private readonly filePath: string) {}

  private async load(): Promise<Map<string, ObjectMeta>> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, ObjectMeta>;
      this.cache = new Map(Object.entries(parsed));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        this.cache = new Map();
      } else {
        throw err;
      }
    }
    return this.cache;
  }

  private async persist(): Promise<void> {
    const map = await this.load();
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const obj: Record<string, ObjectMeta> = {};
    for (const [k, v] of map) obj[k] = v;
    await fs.writeFile(this.filePath, JSON.stringify(obj, null, 2));
  }

  async get(key: string): Promise<ObjectMeta | undefined> {
    return (await this.load()).get(key);
  }

  async upsert(meta: ObjectMeta): Promise<void> {
    const map = await this.load();
    map.set(meta.key, meta);
    await this.persist();
  }

  async remove(key: string): Promise<void> {
    const map = await this.load();
    map.delete(key);
    await this.persist();
  }

  async list(): Promise<ObjectMeta[]> {
    return [...(await this.load()).values()];
  }
}
