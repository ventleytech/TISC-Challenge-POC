import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

/** Minimal Prometheus text exposition (T404). */
@Controller('metrics')
export class MetricsController {
  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics(): string {
    const lines = [
      '# HELP vp_up VoltPulse process up',
      '# TYPE vp_up gauge',
      'vp_up{service="pulse-api",plane="data"} 1',
      '# HELP vp_process_start_time_seconds Process start time',
      '# TYPE vp_process_start_time_seconds gauge',
      `vp_process_start_time_seconds{service="pulse-api"} ${process.uptime() > 0 ? (Date.now() / 1000 - process.uptime()).toFixed(0) : 0}`,
      '# HELP vp_nodejs_heap_used_bytes Heap used bytes',
      '# TYPE vp_nodejs_heap_used_bytes gauge',
      `vp_nodejs_heap_used_bytes{service="pulse-api"} ${process.memoryUsage().heapUsed}`,
      '',
    ];
    return lines.join('\n');
  }
}
