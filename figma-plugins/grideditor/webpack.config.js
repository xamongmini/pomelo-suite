// webpack.config.js — Figma Plugin Build Config

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {


  mode: 'production',


  entry: './code.ts',
  output: {
    filename: 'code.js',
    path: path.resolve(__dirname),

    iife: true,

    clean: false,
  },


  devtool: false,


  resolve: {
    extensions: ['.ts', '.js'],
  },


  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {


            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },


  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({

        extractComments: false,

        terserOptions: {


          mangle: {


            toplevel: false,


            properties: false,
          },


          compress: {

            passes: 1,

            drop_console: false,
            drop_debugger: true,

            inline: 1,

            unsafe: false,
          },


          format: {

            comments: false,

            beautify: false,
          },
        },
      }),
    ],
  },


  target: ['web', 'es2017'],


  performance: {
    hints: 'warning',
    maxAssetSize: 500_000,
    maxEntrypointSize: 500_000,
  },
};
