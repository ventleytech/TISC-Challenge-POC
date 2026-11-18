export interface HttpSettings {
  host: string;
  port: number;
  maxBodyBytes: number;
}

function parsePositiveInt(name: string, raw: string | undefined, fallback: number): number {
  const n = Number((raw ?? '').trim() || fallback);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return n;
}

/** HTTP listener settings (PULSE_STORE_HTTP_*). Object-store settings stay in loadSettings(). */
export function loadHttpSettings(env: NodeJS.ProcessEnv = process.env): HttpSettings {
  const port = parsePositiveInt('PULSE_STORE_HTTP_PORT', env.PULSE_STORE_HTTP_PORT, 3030);
  if (port > 65535) throw new Error('PULSE_STORE_HTTP_PORT must be <= 65535');
  return {
    host: (env.PULSE_STORE_HTTP_HOST ?? '').trim() || '0.0.0.0',
    port,
    maxBodyBytes: parsePositiveInt(
      'PULSE_STORE_HTTP_MAX_BYTES',
      env.PULSE_STORE_HTTP_MAX_BYTES,
      26_214_400,
    ),
  };
}
