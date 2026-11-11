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
      // __GAME_VERSION__ and __GAME_BUILD__ are substituted at build time by
      // vite.config.js, so they exist in the bundle but not in the source.
      globals: { ...globals.browser, __GAME_VERSION__: 'readonly', __GAME_BUILD__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
