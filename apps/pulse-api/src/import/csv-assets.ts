/** M03 asset/site CSV parse + dry-run validation (P0-T406). */

export type CsvAssetRow = {
  name: string;
  site_name?: string;
  criticality?: string;
  voltage_class?: string;
};

export type CsvParseResult = {
  rows: CsvAssetRow[];
  errors: string[];
};

const CRITICALITY = new Set(['critical', 'high', 'medium', 'low']);

/** Minimal CSV splitter — supports quoted commas. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseAssetsCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  const errors: string[] = [];
  if (lines.length === 0) {
    return { rows: [], errors: ['CSV is empty'] };
  }
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.indexOf('name');
  if (nameIdx < 0) {
    return { rows: [], errors: ['header must include name'] };
  }
  const siteIdx = header.indexOf('site_name');
  const critIdx = header.indexOf('criticality');
  const voltIdx = header.indexOf('voltage_class');
  const rows: CsvAssetRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const name = (cols[nameIdx] ?? '').trim();
    if (!name) {
      errors.push(`row ${i + 1}: name required`);
      continue;
    }
    const row: CsvAssetRow = { name };
    if (siteIdx >= 0 && cols[siteIdx]) row.site_name = cols[siteIdx];
    if (critIdx >= 0 && cols[critIdx]) {
      const c = cols[critIdx].toLowerCase();
      if (!CRITICALITY.has(c)) {
        errors.push(`row ${i + 1}: bad criticality ${cols[critIdx]}`);
      } else {
        row.criticality = c;
      }
    }
    if (voltIdx >= 0 && cols[voltIdx]) row.voltage_class = cols[voltIdx];
    rows.push(row);
  }
  return { rows, errors };
}
