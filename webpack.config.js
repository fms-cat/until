/* eslint-env node */

const path = require( 'path' );

const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

module.exports = ( env, argv ) => {
  return {
    devtool: argv.mode === 'production' ? false : 'inline-source-map',
    entry: path.resolve( __dirname, 'src/main.js' ),
    output: {
      path: path.resolve( __dirname, 'dist' ),
      filename: 'bundle.js'
    },
    devServer: {
      inline: true,
      hot: true
    },
    resolve: {
      alias: {
        '@fms-cat/automaton': (
          argv.mode === 'production'
            ? __dirname + '/src/automaton.fuckyou.js'
            : '@fms-cat/automaton'
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
      new HtmlWebpackPlugin()
    ]
  };
};