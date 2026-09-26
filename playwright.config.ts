import {resolve} from "node:path";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: { LIBRARY_DISABLE_GUIDE_GENERATION: "1", LIBRARY_PERSONAL_DIRECTORY: resolve("test-results/library-personal"), NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", LIBRARY_BACKUP_DIRECTORY: process.env.LIBRARY_E2E_BACKUP_DIRECTORY ?? "", LIBRARY_BUILD_DIR: ".next-tests" }
  }
});
