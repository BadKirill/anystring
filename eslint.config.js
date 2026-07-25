import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'ios', 'android'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      sonarjs,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Complexity budget (complexipy/ruff equivalents)
      'sonarjs/cognitive-complexity': ['error', 10],
      complexity: ['error', 10],
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      'max-depth': ['error', 3],
    },
  },
  {
    // src/core must stay portable: pure TS, no React/DOM/platform code
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', '*.tsx'],
              message: 'src/core must stay free of React.',
            },
            {
              group: ['**/audio/**', '**/components/**', '**/state/**', '**/storage/**'],
              message: 'src/core must not depend on platform layers.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'src/core must stay free of browser APIs.' },
        { name: 'document', message: 'src/core must stay free of browser APIs.' },
        { name: 'localStorage', message: 'src/core must stay free of browser APIs.' },
        { name: 'navigator', message: 'src/core must stay free of browser APIs.' },
      ],
    },
  },
  {
    // Test files may exceed function-length limits (describe blocks)
    files: ['**/*.test.ts', '**/*.test.tsx', 'e2e/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'sonarjs/cognitive-complexity': 'off',
    },
  },
  prettier,
)
