const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  target: 'electron-renderer',
  externals: {
    electron: 'require("electron")' // <-- ✅ prevent bundling Electron
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    fallback: {
      fs: false,
      path: false,
      global: require.resolve('global')
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ]
};
