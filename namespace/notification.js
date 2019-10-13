'uses strict';
const debug = require('debug')('spruce:socketNotifications');
const path = require('path');

const pathToRoot = '../';

// Notification Socket.IO setup
module.exports = (conf, io) => {
  const {name, jwt} = conf;
  const serverMap = new Map();

  // Models
  const Token = require(path.join(__dirname, pathToRoot, 'models/token'));
  // Utilities
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);

  const notificationNamespace = io.of('/notification');

  // socket.io authentication middleware
  notificationNamespace.use(async (socket, next) => {
   const token = socket.handshake.query.token;
   if (!token) return next(new Error('Invalid socket request'));       

   // verify token
   const validToken = jwtUtils.verify(token, jwtUtils.TOKEN_REFRESH);
   if (validToken) {
     const revoked = await Token.findOne({ refreshToken: token }).revoked || false;
     if (!revoked) {       
       socket._id = validToken.userId;
       return next();
     }
     return next(new Error('Token revoked'));
   }
   next(new Error('Invalid Token'));
  });

  //PersonModel.find({ favoriteFood : { $all : ["sushi", "bananas"] }, ...})

  // handle the notification Namespace
  notificationNamespace.on('connection', (socket) => {
    socket.on('join', data => {
      const { sessionId } = data;
      socket.sessionId = sessionId;
      serverMap.set(sessionId, socket._id);
      socket.join(socket._id);
    });

    socket.on('disconnect', reason => {
      serverMap.delete(socket.sessionId)
    });


  });
};