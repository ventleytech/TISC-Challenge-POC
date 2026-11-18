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
  },
});
