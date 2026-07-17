import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  retries: 0,
  timeout: 20_000,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5174/what-to-eat/",
    headless: true,
    reducedMotion: "reduce",
  },
  webServer: {
    command: "python3 -m http.server 5174 --bind 127.0.0.1 --directory ..",
    url: "http://127.0.0.1:5174/what-to-eat/",
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
