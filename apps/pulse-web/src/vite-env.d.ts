/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PULSE_API_URL?: string;
  /** Set to `1` to enable live Nest at default `http://127.0.0.1:3000/api/v1`. */
  readonly VITE_PULSE_API_BASE?: string;
  /** Optional stub credential → `X-API-Key` on live requests. */
  readonly VITE_PULSE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
