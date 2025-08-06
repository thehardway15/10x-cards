import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  testDir: "./e2e-tests",
  fullyParallel: false, // Disable parallel execution to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Always use 1 worker to avoid conflicts
  reporter: [["html"], ["list"]],
  use: {
    // Base URL for all relative URLs
    baseURL: "http://localhost:3000",

    // Collect trace when test fails
    trace: "on-first-retry",

    // Capture screenshots on failure
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  // Configure snapshots to use consistent naming across platforms
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      // Use consistent naming without platform/browser suffixes
      pathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
    },
  },
});
