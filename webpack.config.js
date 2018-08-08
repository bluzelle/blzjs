const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');


module.exports = [
    {
        mode: 'development',
        entry: './src/api.js',
        output: {
            path: path.resolve('lib'),
            filename: 'bluzelle.node.js',
            libraryTarget: "commonjs",
        },
        target: 'node',

        plugins: [
            new WebpackShellPlugin({onBuildStart: ['proto/updateProto.sh']})
        ]
    },

    {
        mode: 'development',
        entry: './src/api.js',
        output: {
            path: path.resolve('lib'),
            filename: 'bluzelle.web.js',
            libraryTarget: "commonjs",
        },
        target: 'web',

        plugins: [
            new WebpackShellPlugin({onBuildStart: ['proto/updateProto.sh']})
        ]
    }
];