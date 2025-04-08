const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'development', // или 'production' для билда
  entry: './client/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    //filename: 'bundle.[contenthash].js',
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-react', {runtime: 'automatic', importSource: 'preact'}],
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', {version: '2023-05'}]
            ],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                quietDeps: true,
                silenceDeprecations: true,
              },
            },
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './client/index.html',
      inject: 'body',
    }),
    //new BundleAnalyzerPlugin()
  ],
  devtool: 'source-map',
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 8080,
    historyApiFallback: true,
  },
  stats: {
    warnings: false
  }
};