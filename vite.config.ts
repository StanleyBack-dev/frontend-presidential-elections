import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Link previews (WhatsApp, Telegram, Facebook, X) need ABSOLUTE URLs in the
 * Open Graph tags. The site's origin comes from VITE_SITE_URL or, on Vercel,
 * from the production domain it exposes at build time. Without either
 * (local dev), the tags fall back to relative paths.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: "site-url",
    transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", siteUrl),
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const productionHost = env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = (
    env.VITE_SITE_URL || (productionHost ? `https://${productionHost}` : "")
  ).replace(/\/+$/, "");

  return {
    plugins: [react(), tsconfigPaths(), siteUrlPlugin(siteUrl)],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
