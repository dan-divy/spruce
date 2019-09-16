'use strict';
var path = require('path');
var distDir = path.join(__dirname, 'dist');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var conf = require('./config.json');
module.exports = {
    entry: './app/index.ts',
    output: {
        filename: 'spruce.js',
        path: distDir
    },
    devServer: {
        contentBase: distDir,
        port: 60800,
        proxy: {
            '/api': 'http://localhost:60702'
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: conf.name
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ],
    module: {
        rules: [{
                test: /\.ts$/,
                loader: 'ts-loader'
            }, {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }, {
                test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            }]
    }
};
//# sourceMappingURL=webpack.config.js.map