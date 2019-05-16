const path = require('path');
const WebpackShellPlugin = require('webpack-shell-plugin');


// We want to build for production (i.e. minimize 
// the bluzelle-js code and have no sourcemaps) when
// deploying.

const mode = 

    'TRAVIS_BUILD_STAGE_NAME' in process.env &&
    process.env['TRAVIS_BUILD_STAGE_NAME'] === 'Deploy' 
        
        ? 'production' : 'development';


module.exports = [
    {
        mode,
        entry: './src/main.js',
        output: {
            path: path.resolve('lib'),
            filename: 'bluzelle-node.js',
            libraryTarget: "commonjs",
        },
        target: 'node',

        plugins: [
            new WebpackShellPlugin({onBuildStart: ['proto/updateProto.sh']})
        ]
    },

    {
        mode,
        entry: './src/main.js',
        output: {
            path: path.resolve('lib'),
            filename: 'bluzelle-web.js',
            libraryTarget: "commonjs",
        },
        target: 'web',


        plugins: [
            new WebpackShellPlugin({onBuildStart: ['proto/updateProto.sh', 'scripts/scrypt.rb']}),
        ],

        module: { 
            rules: [   
                {
                    test: /\.node$/,
                    use: "node-loader"
                }
            ],
        }
    }
];
