const globals = require('globals')
const expoConfig = require('eslint-config-expo/flat')

module.exports = [
  {
    ignores: ['.expo', '.expo-shared', 'dist', 'node_modules', 'eslint.config.js'],
  },
  ...expoConfig,
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
    },
  },
]
