'use strict';
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const expressSession = require('express-session');
const helmet = require('helmet');
const path = require('path');
const redis = require('redis')

const pkg = require('./package.json');
const protection = require('./utils/middleware/protection');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const accountRouter = require('./routes/auth');
const meRouter = require('./routes/settings');
const extraRouter = require('./routes/extras/wordbeater/main');
const categoryRouter = require('./routes/category');
const restApi = require('./routes/api/v1/index');
const publicApiRouter = require('./routes/developer/api');
const chatRouter = require('./routes/chat');

const app = express();
app.conf = require('./config/app');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Define environment
const NODE_ENV = process.env.NODE_ENV || app.conf.env || 'development';
const isDev = NODE_ENV === 'development';

// Setup session environment
var session;
if (isDev) {
  console.log('Operating in DEVELOPMENT mode.');
  const morgan = require('morgan');
  app.use(morgan('dev'));
  // SESSION - Use FileStore in development mode.
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

app.use('/', indexRouter);
app.use('/account', accountRouter);
// Secure routes
app.use(protection.isAuthenticated);
app.use('/u', usersRouter);
app.use('/me', meRouter);
app.use('/api', restApi);
app.use('/category', categoryRouter);
app.use('/products', extraRouter);
app.use('/chat', chatRouter);
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
