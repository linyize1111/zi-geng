import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_APP_BASE_PATH || "/zi-geng/";

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["favicon.svg", "icons/*.svg"],
        manifest: {
          name: "字耕",
          short_name: "字耕",
          lang: "zh-TW",
          description: "私人學習與寫作工作台",
          start_url: `${base}#/today`,
          scope: base,
          display: "standalone",
          orientation: "any",
          background_color: "#f7f4ef",
          theme_color: "#2c2926",
          icons: [
            {
              src: "icons/icon-192.svg",
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "icons/icon-512.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: null,
          globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
          navigateFallbackDenylist: [/^\/api/, /oauth/, /auth\/v1/],
          runtimeCaching: [],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      watch: {
        ignored: ["**/scripts/content/**", "**/supabase/**", "**/.git/**"],
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true,
      globals: false,
      exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    },
  };
});
