import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite'; // FIX: Use the Vite plugin

// https://astro.build/config
export default defineConfig({
  // Remove integrations: [tailwind()]
  vite: {
    plugins: [tailwindcss()],
  },
});