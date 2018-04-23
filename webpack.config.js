const path = require('path')
const externals = require('webpack-node-externals')
const slsw = require('serverless-webpack')

let entries =  slsw.lib.entries

module.exports = {
  entry: entries,
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
    filename: '[name].js'
  },
  externals: [externals()],
  devtool: 'source-map'
}
