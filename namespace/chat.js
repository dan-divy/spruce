'uses strict';
const debug = require('debug')('spruce:socketChat');
const path = require('path');

const pathToRoot = '../';

// Chat room Socket.IO setup
module.exports = (conf, io) => {
  const {jwt, name} = conf;

  // Models
  const Message = require(path.join(__dirname, pathToRoot, 'models/message'));
  const Token = require(path.join(__dirname, pathToRoot, 'models/token'));
  // Utilities
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);

  const chatNamespace = io.of('/chat');

  // socket.io authentication middleware
  chatNamespace.use(async (socket, next) => {
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

  // handle the chat namespace
  chatNamespace.on('connection', (socket) => {
    socket.on('join', data => {
      const { username, chatroom } = data;
      socket.username = username;
      socket.chatroom = chatroom;
      socket.join(socket.chatroom);
      socket.broadcast.to(chatroom).emit('user joined', {
        username: socket.username,
        roomcount: chatNamespace.adapter.rooms[socket.chatroom].length
      });

      Message
      .find({ chatroom: socket.chatroom })
      .select('user message_body sent_at')
      .sort({sent_at: 'asc'})
      .limit(50)
      .populate({ path: 'user', select: '-_id username' })
      .then(posts => {
        socket.emit('history', posts);
      });
    });

    socket.on('new message', (data) => {
      Message.create({
        user: data.userId,
        chatroom: socket.chatroom,
        message_body: data.message,
        sent_at: data.sent_at
      }, (err, message) => {
        if (!err) chatNamespace.to(socket.chatroom).emit('new message', data);
      });
    });

    socket.on('typing', () => {
      socket.broadcast.to(socket.chatroom).emit('typing', {
        username: socket.username
      });
    });

    socket.on('stop typing', () => {
      socket.broadcast.to(socket.chatroom).emit('stop typing', {
        username: socket.username
      });
    });

    socket.on('leave', () => {
      socket.leave(socket.chatroom)
      if (socket.username) {
        var roomcount = 0;
        if (chatNamespace.adapter.rooms[socket.chatroom]) {
          roomcount = chatNamespace.adapter.rooms[socket.chatroom].length;
        }
        socket.broadcast.to(socket.chatroom).emit('user left', {
          username: socket.username,
          roomcount: roomcount
        });
      }
      socket.chatroom = null;
    });
  });
};