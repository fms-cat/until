/* eslint-env node */

const path = require( 'path' );

const webpack = require( 'webpack' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

module.exports = ( env, argv ) => {
  return {
    devtool: argv.mode === 'production' ? false : 'inline-source-map',
    entry: path.resolve( __dirname, 'src/main.js' ),
    output: {
      path: path.resolve( __dirname, 'dist' ),
      filename: (
        argv.mode === 'production'
          ? 'bundle.prod.js'
          : 'bundle.js'
      )
    },
    devServer: {
      inline: true,
      hot: true
    },
    resolve: {
      alias: {
        '@fms-cat/automaton': (
          argv.mode === 'production'
            ? path.resolve( __dirname, 'src/automaton.fuckyou.js' )
            : '@fms-cat/automaton'
        ),
        'glcat-path': (
          argv.mode === 'production'
            ? path.resolve( __dirname, 'src/libs/glcat-path.js' )
            : path.resolve( __dirname, 'src/libs/glcat-path-gui.js' )
        )
      }
    },
    module: {
      rules: [
        { test: /\.(png|jpg|gif|ttf|otf)$/, use: 'url-loader' },
        { test: /\.(glsl|frag|vert)$/, use: [ 'raw-loader' ] }
      ]
    },
    optimization: {
      minimize: argv.mode === 'production'
    },
    plugins: [
      new HtmlWebpackPlugin( {
        filename: (
          argv.mode === 'production'
            ? path.resolve( __dirname, 'dist/index.prod.html' )
            : path.resolve( __dirname, 'dist/index.html' )
        )
      } ),
      new webpack.DefinePlugin( {
        PRODUCTION: JSON.stringify( argv.mode === 'production' )
      } )
    ]
  };
};