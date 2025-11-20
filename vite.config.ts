// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          pdf: ['jspdf', 'jspdf-autotable'],
          xlsx: ['xlsx'],
          router: ['react-router-dom']
        },
        // Optimizar nombres de archivos para reducir cantidad
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    chunkSizeWarningLimit: 1500,
    // Reducir el número total de archivos
    assetsInlineLimit: 8192, // Inline assets pequeños como base64
    sourcemap: false // No generar sourcemaps en producción
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
})