// path: src/config/urls.config.ts

import { EnvConfig } from './env.config';

const base = EnvConfig.baseUrl;

/**
 * Centralised URL map for every application route.
 * Import this instead of hard-coding paths in page objects or tests.
 *
 * Add one entry here each time a new page object is created. Routes that take
 * a parameter are written as functions:
 *   productDetail: (id: number) => `${base}/product?id=${id}`
 */
export const Urls = {
  home: `${base}/`,
} as const;
