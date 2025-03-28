const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',

  entry: './client/index.js',

  output: {
    path: path.resolve(__dirname, 'dist'), filename: 'bundle.js', publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: path.resolve(__dirname),
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/, use: ['style-loader', 'css-loader']
      }]
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },

  devServer: {
    static: path.join(__dirname, 'dist'), historyApiFallback: true, port: 3000, open: true
  }
};
