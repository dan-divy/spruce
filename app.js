'uses strict';
const compression = require('compression');
const createError = require('http-errors');
const debug = require('debug')('spruce:app');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');

const nconf = require('nconf');
nconf
  .argv()
  .env('__')
  .defaults({
    conf: `${__dirname}/config.json`,
    'NODE_ENV': 'development'
  });
nconf.file(nconf.get('conf'));
const mongo = nconf.get('mongo');

const app = express();

// Define environment
const NODE_ENV = process.env.NODE_ENV || nconf.get('env') || 'development';
app.set('env', NODE_ENV);
const isDev = NODE_ENV === 'development';

// Connect to mongoDB
var mongoUri = 'mongodb://' + mongo.host + ':' + mongo.port + '/' + mongo.database;
var options = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true  
};
if (mongo.auth) {
  options.user = mongo.username;
  options.pass = mongo.password;
} else {
  mongoUri += '-dev';
}
mongoose.connect(mongoUri, options, (err) => {
  if (err) {
    debug(`ERROR connecting to DB: ${mongo.host}`);
    return process.exit(1);
  }
  console.log(`Successfully connected to DB: ${mongo.host}`);
});

// Setup for SPA
if (isDev) {
  const morgan = require('morgan');
  app.use(morgan('combined', { stream: { write: msg => debug(msg.trimEnd()) } }));
} else {
  app.use(compression());
  app.use(helmet());
} 

app.set('trust proxy', 1); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// server setting
const port = process.env.PORT || nconf.get('port') || '3000';
app.set('port', port);

if (isDev) {
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackConfig = require('./webpack.config.js');

  app.use(webpackMiddleware(webpack(webpackConfig), {
    publicPath: '/',
    stats: { colors: true }
  }))
  app.use(express.static('static'));
} else {
  app.use(express.static('dist'));
}

if (nconf.get('sso').enabled) {
  // Init passport authentication 
  app.use(passport.initialize());
  // persistent login sessions 
  app.use(passport.session());
  require('./utils/sso')(passport, nconf.get('sso'));
}


// ROUTES - API
const api = nconf.get('api');
if (!api) {
  debug('Missing API parameter in config.json');
  return process.exit(1);
}
app.set('api', api);
app.set('conf', nconf.get());

app.get('/api/version', (req, res) => res.status(200).send({ 
  apiVersion: api, 
  apiEndpoint: nconf.get('apiEndpoint') 
}));
app.use(`/api/${api}/auth/`, require(`./routes/${api}/authentication`)(nconf.get(), passport));
app.use(`/api/${api}/community/`, require(`./routes/${api}/community`)(nconf.get()));
app.use(`/api/${api}/chat/`, require(`./routes/${api}/chat`)(nconf.get()));
app.use(`/api/${api}/post/`, require(`./routes/${api}/post`)(nconf.get()));
app.use(`/api/${api}/user/`, require(`./routes/${api}/user`)(nconf.get()));

module.exports = app;
