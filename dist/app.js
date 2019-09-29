"use strict";
'uses strict';
var createError = require('http-errors');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var debug = require('debug')('oak:app');
var express = require('express');
var expressSession = require('express-session');
var helmet = require('helmet');
var path = require('path');
var nconf = require('nconf');
nconf
    .argv()
    .env('__')
    .defaults({
    conf: __dirname + "/config.json",
    'NODE_ENV': 'development'
});
nconf.file(nconf.get('conf'));
var cookie = nconf.get('cookie');
var mongo = nconf.get('mongo');
var app = express();
// Define environment
var NODE_ENV = nconf.get('env') || 'development';
app.set('env', NODE_ENV);
var isDev = NODE_ENV === 'development';
// Setup SESSION management for SPA
var session;
if (isDev) {
    debug('Operating in DEVELOPMENT mode.');
    var morgan = require('morgan');
    app.use(morgan('dev'));
    // SESSION - Use FileStore in development mode.to reduce the authentication burdon.
    var fileStore = require('session-file-store')(expressSession);
    session = expressSession({
        resave: cookie.resave,
        saveUninitialized: cookie.saveUninitialized,
        secret: cookie.secret,
        expires: cookie.expiresIn,
        store: new fileStore(),
    });
}
else {
    // SESSION - Use RedisStore in production mode.
    var redisCfg = nconf.get('redis');
    var redis = require('redis');
    var redisStore = require('connect-redis')(expressSession);
    var redisClient = redis.createClient();
    session = expressSession({
        resave: cookie.resave,
        saveUninitialized: cookie.saveUninitialized,
        secret: cookie.secret,
        expires: cookie.expiresIn,
        store: new redisStore({
            host: redisCfg.host,
            port: redisCfg.port,
            client: redisClient
        }),
    });
    app.use(compression());
    app.use(helmet());
}
app.use(session);
// End Session setup
app.set('trust proxy', 1);
//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// server setting
var port = process.env.PORT || nconf.get('port') || '3000';
app.set('port', port);
/* SPA Error Handler

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});*/
// SPA Serve webpack assets
if (isDev) {
    var webpack = require('webpack');
    var webpackMiddleware = require('webpack-dev-middleware');
    var webpackConfig = require('./webpack.config.js');
    app.use(webpackMiddleware(webpack(webpackConfig), {
        publicPath: '/',
        stats: {
            colors: true
        }
    }));
}
else {
    app.use(express.static('dist'));
}
module.exports = app;
//# sourceMappingURL=app.js.map