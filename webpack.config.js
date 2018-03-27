var path = require('path');
var webpack = require('webpack');
var combineLoaders = require('webpack-combine-loaders');

module.exports = {
  entry: ['babel-polyfill', './static/js/app.jsx'],
  output: { 
      path: path.resolve(__dirname, './static/js/'), 
      filename: 'bundle.js' },
  module: {
    rules: [
        {
          test: /\.jsx$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['babel-preset-env','babel-preset-react']
            }
          }
        },
        { 
          test: /\.css$/, 
          use: [ 'style-loader', 'css-loader' ]
        }
      ]
  }
};
