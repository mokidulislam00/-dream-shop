import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// In development, /api requests are proxied to the backend so the auth
// cookie stays first-party (same origin as the Vite dev server).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_DEV_PROXY_TARGET || "http://localhost:5000";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": { target, changeOrigin: true },
      },
    },
  };
});
