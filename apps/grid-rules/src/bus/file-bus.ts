import { appendFile, mkdir, open, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { EmittedRecord } from './memory-sink.js';

/**
 * Tail a JSONL file by byte offset; returns complete new lines each poll.
 * Missing file → []. Truncated file → restart from 0. Partial last line is held back.
 */
export class FileTail {
  private offset = 0;
  private carry = '';

  constructor(private readonly path: string) {}

  async poll(): Promise<string[]> {
    let size: number;
    try {
      size = (await stat(this.path)).size;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    if (size < this.offset) {
      this.offset = 0;
      this.carry = '';
    }
    if (size === this.offset) return [];
    const fh = await open(this.path, 'r');
    try {
      const buf = Buffer.alloc(size - this.offset);
      const { bytesRead } = await fh.read(buf, 0, buf.length, this.offset);
      this.offset += bytesRead;
      const parts = (this.carry + buf.subarray(0, bytesRead).toString('utf8')).split('\n');
      this.carry = parts.pop() ?? '';
      return parts.map((l) => l.trim()).filter(Boolean);
    } finally {
      await fh.close();
    }
  }
}

/** Append emitted records to `<outDir>/<topic>.jsonl` (one JSON payload per line). */
export async function appendRecords(outDir: string, records: EmittedRecord[]): Promise<void> {
  if (records.length === 0) return;
  await mkdir(outDir, { recursive: true });
  const byTopic = new Map<string, string>();
  for (const r of records) {
    byTopic.set(r.topic, (byTopic.get(r.topic) ?? '') + JSON.stringify(r.payload) + '\n');
  }
  for (const [topic, text] of byTopic) {
    await appendFile(join(outDir, `${topic}.jsonl`), text, 'utf8');
  }
}
