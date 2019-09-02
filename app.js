'use strict';
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const expressSession = require('express-session');
const helmet = require('helmet');
const mongoose = require("mongoose");
const path = require('path');
const redis = require('redis')

const pkg = require('./package.json');
const protection = require('./utils/middleware/protection');

const accountRouter = require('./routes/auth');
const categoryRouter = require('./routes/category');
const chatRouter = require('./routes/chat');
const extraRouter = require('./routes/extras/wordbeater/main');
const indexRouter = require('./routes/index');
const meRouter = require('./routes/settings');
const usersRouter = require('./routes/users');

const publicApiRouter = require('./routes/developer/api');
const restApiV1file = require('./routes/api/v1/file');
const restApiV1community = require('./routes/api/v1/community');
const restApiV1index = require('./routes/api/v1/index');

const app = express();
app.conf = require('./config/app');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Define environment
const NODE_ENV = process.env.NODE_ENV || app.conf.env || 'development';
app.set('env', NODE_ENV);
const isDev = NODE_ENV === 'development';

mongoose.connect(require(path.join(__dirname, 'config/app')).db.connectionUri, {
  useNewUrlParser: true
}, (err) => {
  if (err) {
    console.log(`ERROR connecting to DB: ${app.conf.db.host}`);
    return process.exit(1);
  }
  console.log(`Successfully connected to DB: ${app.conf.db.host}`);
});

var session;
if (isDev) {
  console.log('Operating in DEVELOPMENT mode.');
  const morgan = require('morgan');
  app.use(morgan('dev'));
  // SESSION - Use FileStore in development mode.to reduce the authentication burdon.
  const fileStore = require('session-file-store')(expressSession);
  const redisClient = redis.createClient();
  session = expressSession ({
    resave: app.conf.cookie.resave,
    saveUninitialized: app.conf.cookie.saveUninitialized,
    secret: app.conf.cookie.secret,
    expires: app.conf.cookie.expiresIn,
    store: new fileStore(),
  });
} else {
  // SESSION - Use RedisStore in production mode.
  const redisStore = require('connect-redis')(expressSession);
  const redisClient = redis.createClient();
  session = expressSession({
    resave: app.conf.cookie.resave,
    saveUninitialized: app.conf.cookie.saveUninitialized,
    secret: app.conf.cookie.secret,
    expires: app.conf.cookie.expiresIn,
    store: new redisStore({
      host: app.conf.redis.host,
      port: app.conf.redis.port,
      client: redisClient
    }),
  });
  app.use(compression());
  app.use(helmet());
} 
app.use(session);
app.sessionMiddleware = session;
// End Session setup

app.set('trust proxy', 1); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/version', (req, res) => {
  res.status(200).json({ 
    version: pkg.version,
    mode: app.node_env,
  });
});

// Public routes
app.use('/', indexRouter);
app.use('/account', accountRouter);

// Secure routes
//app.use(protection.isAuthenticated);

app.use('/u', usersRouter);
app.use('/me', meRouter);
app.use('/category', categoryRouter);
app.use('/products', extraRouter);
app.use('/chat', chatRouter);

app.use('/api/v1', restApiV1index);
app.use('/api/v1/community', restApiV1community);
app.use('/api/v1/file', restApiV1file);
app.use('/developer', publicApiRouter);

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
  res.render('error', {
    title: req.app.conf.name,
  });
});

module.exports = app;
