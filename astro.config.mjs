// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://micahkesiena.vercel.app", // Replace this with your actual domain when deploying
  output: "hybrid",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react(), sitemap()],
});
