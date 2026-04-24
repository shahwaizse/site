import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://shahwaiz.dev",
  output: "server",
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  security: {
    checkOrigin: false,
  },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    mdx(),
  ],
  prefetch: true,
});
