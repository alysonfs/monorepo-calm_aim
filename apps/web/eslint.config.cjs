const baseConfig = require('@calm-aim/eslint-config');

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
  },
];
