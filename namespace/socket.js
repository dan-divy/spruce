'uses strict';
const debug = require('debug')('spruce:socket');
const socketioAuth = require('socketio-auth');
const path = require('path')

const pathToRoot = '../';

module.exports = (conf, io) => {
  const {api, jwt, name} = conf;

  // Models
  const Token = require(path.join(__dirname, pathToRoot, 'models/token'));
  // Utilities
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);

/*
  io.of((name, query, next) => {
  next(null, checkToken(query.token));
}).on('connect', (socket) => {

  });*/
  // middleware
  /*io.use((socket, next) => {
    let token = socket.handshake.query.token;

    debug(token)

    if (jwtUtils.verify(token)) {
      return next();
    }
    return next(new Error('authentication error'));
  });
  */

  //require('./chat')(api, name, io);

  //const chatNameSpace = require('./chat')(api, name, io);
  //return { chatNameSpace }

  // Configure Authentication
  socketioAuth(io, { authenticate, postAuthenticate, timeout: "none" });
};

// Authenticate with the refresh token
const authenticate = async (client, data, callback) => {

  debug('authenticate called')


  const { token } = data;
  try {
    if (token) {
      const result = await Token.find({ refreshToken : token })
      callback(null, result && !result.revoked);
    } else {
      callback(null, false);
    }
  } catch (error) {
    callback(error);
  }
};

// Register Actions
const postAuthenticate = client => {
  io.on("connection", client => {
    debug("new connection")
    client.on("disconnect", () => debug("closed connection"))
  //   client.on("an event", payload => doSomething())
  //   client.emit("some event", somePayload)
  });

  client.on("poke", () => client.emit("poked"));
  client.on("tickle", () => client.emit("tickled"));

  require('./chat')(io);

};