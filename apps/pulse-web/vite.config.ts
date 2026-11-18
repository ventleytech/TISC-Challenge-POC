import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@voltpulse/ui-tokens": path.resolve(
        rootDir,
        "../../packages/ui-tokens",
      ),
      "@voltpulse/i18n": path.resolve(rootDir, "../../packages/i18n/src/index.js"),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Dev: browser may not reach :3000 directly — proxy Nest under same origin.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
