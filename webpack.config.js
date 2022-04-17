const path = require('path');

module.exports = {
  entry: './src/game.js',
  output: {
    filename: 'script.js',
    path: path.resolve(__dirname, 'dist')
  }
};
