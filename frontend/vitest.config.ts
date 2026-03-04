import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: true,
    // 테스트 실행 전 설정 파일 경로
    setupFiles: ['./src/test/setup.ts'],
    // 테스트 파일 탐색 경로
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    // CI 환경일 때만 html 리포터를 추가로 동작
    reporters: process.env.CI ? ['default', 'html'] : ['default'],
    outputFile: {
      html: './html/index.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      '@schema': path.resolve(dirname, 'src/types/schema.d.ts'),
    },
  },
});
