/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: {
        'postcss-nesting': {},
        'postcss-preset-env': { stage: 2 },
    },
};

export default config;
