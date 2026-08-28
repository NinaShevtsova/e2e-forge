// path: eslint.config.mjs
//
// ESLint 9 flat config. Kept deliberately small: type-aware rules are not
// enabled, so linting stays fast and needs no parser project wiring.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'reports/**', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
