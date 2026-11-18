import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const shouldGenerateSourcemap = env.VITE_DISABLE_SOURCEMAPS !== 'true'
  
  // Check if we're running in hierarchy-local mode (port 4021)
  const isHierarchyLocal = process.env.HIERARCHY_LOCAL === 'true'
  
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    },
    base: '/',
    assetsInclude: ['**/*.md'],
    server: {
      host: true,
      port: isHierarchyLocal ? 4021 : 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
        '/media': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
      fs: {
        allow: ['..'],
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: shouldGenerateSourcemap,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': [
              'react',
              'react-dom',
              'react-router-dom',
              '@mui/material',
              '@emotion/react',
              '@emotion/styled'
            ],
            'editor': ['@uiw/react-md-editor'],
          }
        }
      },
      manifest: true,
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      exclude: ['js-big-decimal']
    }
  }
})
