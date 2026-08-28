// path: src/config/env.config.ts

/**
 * Reads environment variables at startup and exposes them as typed values.
 * Every value has a default so the suite runs with no .env file present.
 */
export const EnvConfig = {
  /** Target environment: dev | staging | prod */
  env: (process.env['ENV'] ?? 'dev') as 'dev' | 'staging' | 'prod',

  /** Base URL of the application under test */
  baseUrl: process.env['BASE_URL'] ?? '{{BASE_URL}}',

  /**
   * Default test user credentials.
   * `testUserLogin` holds whatever the application's first login field expects —
   * an email address, a username, an employee number. Do not rename it to match
   * one application's convention.
   */
  testUserLogin: process.env['TEST_USER_LOGIN'] ?? '{{TEST_USER_LOGIN}}',
  testUserPassword: process.env['TEST_USER_PASSWORD'] ?? '{{TEST_USER_PASSWORD}}',

  /** Whether tests run in CI */
  isCI: process.env['CI'] === 'true',
} as const;
