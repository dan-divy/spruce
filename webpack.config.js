'use strict';
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Webpack = require('webpack');

const distDir = path.join(__dirname, 'dist');
const conf = require('./config.json');

module.exports = {
  entry: './app/index.ts',
  mode: conf.env || 'development',
  output: {
    filename: `${conf.name}.js`,
    path: distDir,
    libraryTarget: 'var',
    library: 'UI'
  },
  resolve: {
    extensions: ['.ts', '.js', '.css']
  },
  devServer: {
    contentBase: distDir,
    port: 60800,
    proxy: {
      '/api': 'http://localhost:60702',
      '/socket.io': 'http://localhost:60702'
    }
  },
  module: {
    rules: [{
      enforce: 'pre',
      test: /\.js$/,
      use: ['source-map-loader'],
    },{
      enforce: 'pre',
      test: /\.ts$/,
      use: ['source-map-loader'],
    },{
      test: /\.ts$/,
      loader: 'ts-loader',
    },{
        test: [/.css$|.scss$/],
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader', 
          'sass-loader',
          'postcss-loader'
        ]
      },{
      test: /\.(png|woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader?limit=100000',
    },{
      test: /\.hbs$/,
      loader: 'handlebars-loader',
    }]
  },
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      title: conf.name,
      filename: 'index.html',
      'meta': {
        'viewport': 'width=device-width, initial-scale=1, shrink-to-fit=no'
      },
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // all options are optional
      filename: 'app.[contenthash:8].css',
      chunkFilename: '[id].css',
      ignoreOrder: false, // Enable to remove warnings about conflicting order
    }),
    new Webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};