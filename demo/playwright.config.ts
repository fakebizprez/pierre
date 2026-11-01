import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'cd .. && bun run build && cd demo && bun run build && bun run preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  use: { baseURL: 'http://localhost:4173' },
});
