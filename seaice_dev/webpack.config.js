const path = require('path');

module.exports = {
  entry: './seaIceGraphs.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, '../seaice/dist'),
    filename: 'bundle.js',
  },
};