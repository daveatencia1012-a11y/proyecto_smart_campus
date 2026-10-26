import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  // Lee frontend/.env (y las variables del sistema) para ubicar el API Gateway.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': env.VITE_API_TARGET || 'http://localhost:3200',
      },
    },
  }
})
