export default {
    dev: {
        '/api': {
            target: 'https://app.act365.com/act',
            changeOrigin: true,
            // pathRewrite: {
            //     '^/api': '/api',
            // },
        },
    },
};
