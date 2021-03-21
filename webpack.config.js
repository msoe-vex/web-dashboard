const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.tsx",
  devtool: 'inline-source-map',
  mode: "development",
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: { presets: ["@babel/env"] }
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.s[ac]ss$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      }
    ]
  },
  resolve: { 
    extensions: ["*", ".js", ".jsx", ".tx", ".tsx"],
    alias: {
      "react-dom": "@hot-loader/react-dom"
    } 
  },
  output: {
    path: path.resolve(__dirname, "dist/"),
    filename: "bundle.js"
  },
  devServer: {
    contentBase: path.join(__dirname, "dist/"),
    compress: true,
    port: 3400,
    hotOnly: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(), 
    new HtmlWebpackPlugin({
        hash: true,
        title: "WebDashboard-v2.0",
        template: path.resolve(__dirname, "src/index.html")
    })]
};