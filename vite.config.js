import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
export default defineConfig({plugins:[react(),{name:'server-entry',closeBundle(){if(fs.existsSync('dist/server.html'))fs.renameSync('dist/server.html','dist/index.html');}}],server:{host:'127.0.0.1'},build:{outDir:'dist',rollupOptions:{input:'server.html'}}});
