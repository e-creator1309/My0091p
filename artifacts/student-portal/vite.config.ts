import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const basePath = process.env.BASE_PATH ?? "/";
const apiPort = process.env.API_PORT ?? "8080";

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT ?? 3000),
    host: "0.0.0.0",
    allowedHosts: true,
    // In development: proxy /api to the api-server
    proxy: process.env.VITE_API_URL
      ? undefined
      : {
          "/api": {
            target: `http://localhost:${apiPort}`,
            changeOrigin: true,
          },
        },
  },
  preview: {
    port: Number(process.env.PORT ?? 3000),
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
