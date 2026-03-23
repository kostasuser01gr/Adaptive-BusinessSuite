import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

export default defineConfig({
  plugins: [react(), tailwindcss(), metaImagesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("recharts") ||
            id.includes("/d3-") ||
            id.includes("victory-vendor")
          ) {
            return "charts-vendor";
          }
          if (
            id.includes("animejs") ||
            id.includes("@mojs/core") ||
            id.includes("kute.js") ||
            id.includes("framer-motion")
          ) {
            return "animation-vendor";
          }
          if (
            id.includes("@tanstack/react-table") ||
            id.includes("@tanstack/react-virtual")
          ) {
            return "table-vendor";
          }
          if (
            id.includes("@dnd-kit") ||
            id.includes("react-grid-layout")
          ) {
            return "dnd-vendor";
          }
          if (
            id.includes("@radix-ui") ||
            id.includes("lucide-react")
          ) {
            return "ui-vendor";
          }
          if (id.includes("date-fns")) {
            return "date-vendor";
          }
          return "app-vendor";
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
