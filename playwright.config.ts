import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 20_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    headless: true,
    launchOptions: { executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] },
  },
  reporter: "line",
});

