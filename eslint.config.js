import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Lint configuration.
 *
 * Deliberately focused on correctness and safety rather than style: this
 * codebase is written and reviewed in one place, so formatting is handled by
 * convention, while the rules below catch the things that actually break
 * things — unawaited promises, unsafe HTML, stray console output, React hook
 * misuse.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.vercel/**',
      'public/**',
      // Generated or vendored assets.
      '*.config.js',
      'scripts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Warn only: the app is a plain Vite SPA, not React Fast Refresh strict.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Safety rules that matter for this product.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',

      // Unused code is a maintenance cost; allow the conventional _ prefix.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // `any` is sometimes the honest type for untrusted provider JSON.
      '@typescript-eslint/no-explicit-any': 'warn',

      // React Compiler-era advisories. The app deliberately loads data from
      // localStorage/Firestore into state on mount, which is what these flag;
      // converting every store to useSyncExternalStore is a large refactor with
      // real regression risk. They stay visible as warnings, not errors.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    // Test files and scripts may use dev-only conveniences.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      // Test fixtures contain javascript: URLs precisely to prove they are
      // rejected by safeRedirectPath and safeMarkdownUrl.
      'no-script-url': 'off',
    },
  },
  {
    files: ['api/**/*.ts', 'server/**/*.ts'],
    rules: {
      // Server logs are intentional and go to Vercel's log drain.
      'no-console': 'off',
    },
  },
);
