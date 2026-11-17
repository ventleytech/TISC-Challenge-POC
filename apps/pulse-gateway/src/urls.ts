import type { GatewaySettings } from './config.js';
import type { StreamProtocol } from './types.js';

const PATH_RE = /^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,127}$/;

export function normalizeStreamPath(raw: string): string {
  const path = raw.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!path || !PATH_RE.test(path)) {
    throw new Error(`invalid stream path: ${raw}`);
  }
  return path;
}

/** Build MediaMTX-class pull URL from settings (no live MediaMTX required for stub). */
export function buildPullUrl(
  settings: GatewaySettings,
  protocol: StreamProtocol,
  streamPath: string,
): string {
  const path = normalizeStreamPath(streamPath);
  if (protocol === 'rtsp') {
    return `rtsp://${settings.publicHost}:${settings.rtspPort}/${path}`;
  }
  return `rtmp://${settings.publicHost}:${settings.rtmpPort}/${path}`;
}

export function assertPullUrl(protocol: StreamProtocol, url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('url must be non-empty');
  }
  const expected = protocol === 'rtsp' ? 'rtsp://' : 'rtmp://';
  if (!trimmed.toLowerCase().startsWith(expected)) {
    throw new Error(`url must start with ${expected}`);
  }
  return trimmed;
}
