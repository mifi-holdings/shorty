'use strict';

const nextConfig = require('eslint-config-next/core-web-vitals');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
    ...nextConfig,
    prettierConfig,
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_' },
            ],
        },
    },
];
