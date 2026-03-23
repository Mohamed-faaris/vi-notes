import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    ...(mode === "production"
      ? [
          VitePWA({
            registerType: "autoUpdate",
            manifest: {
              name: "vi-notes",
              short_name: "vi-notes",
              description: "vi-notes - PWA Application",
              theme_color: "#0c0c0c",
            },
            pwaAssets: { disabled: false, config: true },
            devOptions: { enabled: false },
          }),
        ]
      : []),
  ],
}));
