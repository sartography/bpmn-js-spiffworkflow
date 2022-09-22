const CopyWebpackPlugin = require('copy-webpack-plugin');

const myModule = {
  rules: [
    {
      test: /\.m?js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: [
            [
              '@babel/plugin-transform-react-jsx',
              {
                importSource: '@bpmn-io/properties-panel/preact',
                runtime: 'automatic',
              },
            ],
          ],
        },
      },
    },
    {
      test: /\.bpmn$/,
      use: 'raw-loader',
    },
  ],
};

const myPlugins = [
  new CopyWebpackPlugin({
    patterns: [
      {
        from: 'assets/**',
        to: 'vendor/bpmn-js',
        context: 'node_modules/bpmn-js/dist/',
      },
      {
        from: 'assets/**',
        to: 'vendor/bpmn-js-properties-panel',
        context: 'node_modules/bpmn-js-properties-panel/dist/',
      },
      { from: '**/*.{html,css}', context: 'app/' },
    ],
  }),
];

module.exports = [
  {
    entry: {
      bundle: ['./app/spiffworkflow'],
    },
    output: {
      path: `${__dirname}/dist`,
      filename: 'bpmn_spiffworkflow.js',
    },
    module: myModule,
    mode: 'development',
    devtool: 'source-map',
  },
  {
    entry: {
      bundle: ['./app/app.js'],
    },
    output: {
      path: `${__dirname}/public`,
      filename: 'app.js',
    },
    module: myModule,
    plugins: myPlugins,
    mode: 'development',
    devtool: 'source-map',
  },
];
