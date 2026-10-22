import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import jseslint from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import pluginOxlint from 'eslint-plugin-oxlint';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import skipFormatting from 'eslint-config-prettier/flat';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,cjs,ts,mts,tsx,vue}']
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  jseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  // Coupe les règles de mise en forme gérées par Prettier (vue/html-indent...). Placé avant
  // app/rules pour que les règles @stylistic déclarées explicitement restent actives.
  skipFormatting,

  {
    name: 'app/rules',
    files: ['**/*.{js,mjs,cjs,ts,mts,tsx,vue}'],
    plugins: { '@stylistic': stylistic },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser }
    },
    rules: {
      // Base rules
      'no-console': process.env.NODE_ENV === 'production' ? ['error', { allow: ['warn', 'error'] }] : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      // Typescript rules (NOTE: some typescript rules extending base rules need them to be disabled)
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-shadow': 'off', // Disabled due to typescript rule
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
      // Vue rules
      'vue/attributes-order': ['error', { alphabetical: true }],
      // Pas de submit implicite : sans attribut type, un <button> dans un <form> vaut submit, donc son
      // @click s'exécute puis le formulaire part en soumission native (rechargement de page).
      'vue/html-button-has-type': 'error',
      'vue/html-indent': ['warn', 2],
      'vue/html-self-closing': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      // Stylistic rules
      // Exemptions : listes de classes utilitaires, données de tracé SVG et URL; trois cas qu'on ne
      // peut pas raccourcir sans les rendre illisibles ou les casser.
      '@stylistic/max-len': ['error', { code: 160, ignorePattern: '(^|\\s)(class|d|href|src)="' }],
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/function-call-spacing': ['error', 'never'],
      // SwitchCase à 1 pour coller à Prettier, qui indente les `case` sous le `switch`.
      '@stylistic/indent': ['warn', 2, { SwitchCase: 1 }],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      '@stylistic/no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectExpression: { multiline: true, minProperties: 5 },
          ObjectPattern: { multiline: true, minProperties: 5 },
          ImportDeclaration: 'never',
          ExportDeclaration: { multiline: true, minProperties: 5 }
        }
      ],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      '@stylistic/operator-linebreak': ['error', 'before'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/semi-spacing': ['error', { before: false, after: true }],
      // Aligné sur Prettier, qui impose toujours `catch (e)`, `function () {}` et `async () =>`.
      '@stylistic/space-before-function-paren': ['error', { named: 'never', anonymous: 'always', asyncArrow: 'always', catch: 'always' }],
      '@stylistic/space-in-parens': ['error', 'never']
    }
  },

  {
    name: 'app/node-files',
    files: ['*.{js,mjs,cjs,ts,mts}'],
    languageOptions: { globals: { ...globals.node } }
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*']
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json')
);
