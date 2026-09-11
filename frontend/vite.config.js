import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': 'http://localhost:3201',
      '/api/usuarios': 'http://localhost:3201',
      '/api/dashboard': 'http://localhost:3201',
      '/api/roles': 'http://localhost:3201',
      '/api/permisos': 'http://localhost:3201',
      '/api/solicitudes': 'http://localhost:3202',
      '/api/pqrs': 'http://localhost:3202',
      '/api/reservas': 'http://localhost:3203',
      '/api/disponibilidad': 'http://localhost:3203',
      '/api/recursos': 'http://localhost:3204',
      '/api/tipos': 'http://localhost:3204',
      '/api/eventos': 'http://localhost:3205',
      '/api/tipos-evento': 'http://localhost:3205',
      '/api/notificaciones': 'http://localhost:3206',
    },
  },
})