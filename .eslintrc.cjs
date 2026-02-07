/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    env: { node: true, es2022: true },
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    ignorePatterns: [
        'node_modules',
        '.pnpm-store',
        'dist',
        '.next',
        'build',
        'coverage',
        '*.tsbuildinfo',
        '.data',
    ],
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: { project: null },
            plugins: ['@typescript-eslint'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'prettier',
            ],
            rules: {
                '@typescript-eslint/no-unused-vars': [
                    'warn',
                    { argsIgnorePattern: '^_' },
                ],
                '@typescript-eslint/no-explicit-any': 'warn',
            },
        },
    ],
};
