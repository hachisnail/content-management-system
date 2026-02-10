import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const htmlPlugin = () => {
    return {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(/__VITE_API_URL__/g, env.VITE_API_URL)
                   .replace(/__VITE_WS_URL__/g, env.VITE_WS_URL)
      },
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      htmlPlugin(), 
    ],
    define: {
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
      __VITE_WS_URL__: JSON.stringify(env.VITE_WS_URL),
    },
  }
})