/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: ['next/core-web-vitals', 'prettier'],
    plugins: ['@typescript-eslint'],
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
};
