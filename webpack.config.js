const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    index: './src/accueil.js',
    connexion: './src/connexion.js',
    inscription: './src/inscription.js',
    compte: './src/compte.js',
    ajouter: './src/ajouter.js',
    modifier: './src/modifier.js',
    article: './src/article.js',
    messagerie: './src/messagerie.js',
    offres: './src/offres.js',
    formulaire: './src/formulaire.js',
  },
  mode: 'development',
  devServer: {
    static: './public',
    hot: true,
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  plugins: [
    new Dotenv()
  ]
};