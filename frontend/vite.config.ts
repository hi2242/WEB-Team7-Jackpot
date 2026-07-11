import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// ESM 환경에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react({ exclude: /\/src\/workers\// }), tailwindcss()],

  worker: {
    // Worker 내부에서도 ESM(import/export) 포맷을 사용하도록 설정
    format: 'es',
  },

  define: {
    // sockjs-client, worker 전역 객체 문제 해결
    // worker 환경: self / window === undefined
    // 브라우저 메인 스레드: self === window
    global: 'self',
  },

  server: {
    port: 3000,
  },

  preview: {
    port: 3000,
  },

  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  test: {
    globals: true, // describe/it/expect 임포트 없이 사용
    environment: 'jsdom', // DOM + localStorage
    setupFiles: './src/test-setup.ts',
  },
});
