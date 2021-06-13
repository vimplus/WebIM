const path = require('path');

function resolve(dir) {
    return path.join(__dirname, dir);
}
module.exports = {
    pages: {
        index: {
            entry: 'examples/main.js',
            template: 'public/index.html',
            filename: 'index.html'
        }
    },
    publicPath: '',
    productionSourceMap: false,
    chainWebpack: (config) => {
        config.resolve.alias
            .set('@', resolve('src'))
            .set('components', resolve('src/components'))
            .set('mixins', resolve('src/mixins'))
            .set('styles', resolve('src/styles'))
            .set('@utils', resolve('src/utils'));
    }
    // configureWebpack: {
    //     resolve: {
    //         alias: {
    //             components: resolve('src/components'),
    //             mixins: resolve('src/mixins'),
    //             styles: resolve('src/styles'),
    //             '@utils': 'src/utils/'
    //         }
    //     }
    // }
};
