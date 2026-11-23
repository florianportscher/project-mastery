import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The local Supabase keys for signed-in tests (e2e/fixtures.ts), as the app
// reads them. Variables already set, as in CI, take precedence.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Each checkout gets its own port (3100-3199), apart from dev servers on
// 3000 and up, so parallel agent worktrees never test each other's server.
const checkoutPort =
  3100 +
  (createHash("sha1").update(process.cwd()).digest().readUInt16BE() % 100);
const PORT = Number(process.env.PORT ?? checkoutPort);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

const FAULT_PORT = PORT + 200;
const faultURL = `http://localhost:${FAULT_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // A CI runner has four cores; locally Playwright takes half of them.
  workers: process.env.CI ? "100%" : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mock-fault\.spec\.ts/,
    },
    // Its own server, where every mock model call fails (`agent up
    // --mock-fault`); no other spec runs on it.
    ...(process.env.PLAYWRIGHT_BASE_URL
      ? []
      : [
          {
            name: "mock-fault",
            use: { ...devices["Desktop Chrome"], baseURL: faultURL },
            testMatch: /mock-fault\.spec\.ts/,
          },
        ]),
    {
      // Only the specs that depend on screen size.
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /(sidebar|chat|home)\.spec\.ts/,
    },
  ],
  // Test against the production build with mock AI and local Supabase.
  // Skipped when PLAYWRIGHT_BASE_URL points at an already-running deployment
  // (e.g. a Vercel preview), where signed-in tests skip themselves.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: `pnpm start --port ${PORT}`,
          url: baseURL,
          // A Daily limit that tests reach by seeding usage (seedAiSpend).
          env: { AI_PROVIDER: "mock", AI_DAILY_LIMIT_USD: "1" },
          // A server already on the port is another build, never this one.
          reuseExistingServer: false,
        },
        {
          command: `pnpm start --port ${FAULT_PORT}`,
          url: faultURL,
          env: { AI_PROVIDER: "mock", MOCK_AI_FAULT: "error" },
          reuseExistingServer: false,
        },
      ],
});
