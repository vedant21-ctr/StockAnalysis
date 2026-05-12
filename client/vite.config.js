import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                ws: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
                    'charts-vendor': ['recharts', 'echarts', 'echarts-for-react'],
                    'motion-vendor': ['framer-motion', 'gsap'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['echarts', 'echarts-for-react'],
    },
})
