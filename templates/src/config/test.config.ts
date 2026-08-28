// path: src/config/test.config.ts

/**
 * Global test behaviour constants shared across the framework.
 * Adjust timeouts here rather than inline in tests or page objects.
 */
export const TestConfig = {
  timeouts: {
    /** Default action timeout (click, fill, etc.) in ms */
    action: 10_000,
    /** Navigation / page-load timeout in ms */
    navigation: 30_000,
    /** Explicit wait for element visibility in ms */
    elementVisible: 15_000,
  },

  /** Storage state path for authenticated sessions */
  authStoragePath: 'reports/.auth/user.json',

  /** Viewport dimensions */
  viewport: {
    width: 1280,
    height: 720,
  },
} as const;
