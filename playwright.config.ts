import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Evidence-Hardened v1.0 compliance testing
 * Tests Expo web version of the Daymark Symptom Tracker
 */
export default defineConfig({
  testDir: './tests',
  
  /* Maximum time one test can run */
  timeout: 60 * 1000,
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for deterministic artifact generation
  
  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'test-artifacts/playwright-report' }],
    ['json', { outputFile: 'test-artifacts/results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects */
  use: {
    /* Base URL for Expo web server */
    baseURL: 'http://localhost:8081',
    
    /* Collect trace for failed tests */
    trace: 'retain-on-failure',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
