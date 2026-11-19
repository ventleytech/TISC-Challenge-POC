import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { DomainStore } from '../domain/domain.store';

/**
 * W06 printable compliance HTML (toward PDF). Browser File→Print = PDF.
 * P0-T407
 */
@Controller('reports')
export class ReportsController {
  constructor(private readonly store: DomainStore) {}

  @Get('compliance')
  @Roles('platform_admin', 'utility_admin', 'energy_supervisor', 'energy_operator', 'viewer')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Content-Disposition', 'inline; filename="voltpulse-compliance.html"')
  async compliance(
    @Query('utility_id') utilityId?: string,
    @Query('inspection_id') inspectionId?: string,
  ): Promise<string> {
    if (!utilityId) {
      throw new BadRequestException('utility_id required');
    }
    const findings = await this.store.listFindings({
      utilityId,
      inspectionId: inspectionId || undefined,
    });
    const byClass = new Map<string, number>();
    let riskSum = 0;
    for (const f of findings) {
      byClass.set(f.class_id, (byClass.get(f.class_id) ?? 0) + 1);
      riskSum += Number(f.risk_score) || 0;
    }
    const rows = [...byClass.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(
        ([cls, n]) =>
          `<tr><td>${escapeHtml(cls)}</td><td class="mono">${n}</td></tr>`,
      )
      .join('');
    const title = inspectionId
      ? `Inspection ${escapeHtml(inspectionId)}`
      : `Utility ${escapeHtml(utilityId)}`;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>VoltPulse compliance — ${title}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;margin:2rem;color:#0f172a;background:#f8fafc}
  h1{font-size:1.5rem;margin:0 0 .25rem}
  .eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.7rem;color:#64748b}
  .badge{display:inline-block;background:#e2e8f0;padding:.2rem .5rem;border-radius:4px;font-size:.75rem;margin:.5rem 0 1rem}
  table{border-collapse:collapse;width:100%;max-width:40rem;background:#fff}
  th,td{border:1px solid #cbd5e1;padding:.5rem .75rem;text-align:left}
  th{background:#0f172a;color:#fff}
  .mono{font-family:ui-monospace,monospace}
  footer{margin-top:2rem;font-size:.8rem;color:#64748b}
  @media print{body{background:#fff;margin:0} .noprint{display:none}}
</style>
</head>
<body>
<p class="eyebrow">VoltPulse · W06</p>
<h1>Compliance findings summary</h1>
<p class="badge">toward PDF — use browser Print → Save as PDF</p>
<p>Scope: <span class="mono">${title}</span></p>
<p>Findings: <strong>${findings.length}</strong> · risk sum: <strong class="mono">${riskSum.toFixed(2)}</strong></p>
<table>
<thead><tr><th>Class</th><th>Count</th></tr></thead>
<tbody>${rows || '<tr><td colspan="2">No findings</td></tr>'}</tbody>
</table>
<footer>VoltPulse Energy inspection OS · generated ${new Date().toISOString()}</footer>
<script class="noprint">/* printable HTML stub */</script>
</body>
</html>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
