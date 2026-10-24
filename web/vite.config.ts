import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["offline.html", "icon.svg"],
      manifest: {
        name: "Disha",
        short_name: "Disha",
        description: "Ghar par healthcare ka sahi raasta",
        theme_color: "#2E3A87",
        background_color: "#F3ECDF",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: { navigateFallback: "/index.html", globPatterns: ["**/*.{js,css,html,svg,png}"] },
    }),
  ],
  // dev convenience: /api/* -> local FastAPI (the app itself uses VITE_API_URL)
  server: { proxy: { "/api": { target: "http://localhost:8000", rewrite: (p) => p.replace(/^\/api/, "") } } },
});
