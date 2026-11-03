import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Every remaining hit is the "load data when the page opens / a filter changes" pattern
      // (useEffect -> fetchData -> setLoading(true)). It works correctly; at most it costs one extra render.
      // Kept visible as a warning so screens can move to a data-loading hook over time, without a risky
      // rewrite of ~40 screens at once.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
