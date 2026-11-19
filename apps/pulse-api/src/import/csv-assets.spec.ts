import { parseAssetsCsv, splitCsvLine } from './csv-assets';

describe('parseAssetsCsv', () => {
  it('parses quoted fields and validates criticality', () => {
    const text = [
      'name,site_name,criticality,voltage_class',
      'Tower "A",North,high,132kV',
      'Bad,,extreme,11kV',
    ].join('\n');
    const r = parseAssetsCsv(text);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].name).toBe('Tower A');
    expect(r.rows[0].criticality).toBe('high');
    expect(r.errors.some((e) => e.includes('criticality'))).toBe(true);
  });

  it('splitCsvLine handles commas in quotes', () => {
    expect(splitCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
  });
});
