'uses strict';
const debug = require('debug')('spruce:socketChat');
const io = require('socket.io');
const path = require('path')

const pathToRoot = '../';

// Chat room Socket.IO setup

module.exports = (conf, server) => {
  const {api, jwt, name} = conf;

  // Models
  const Message = require(path.join(__dirname, pathToRoot, 'models/message'));
  const Token = require(path.join(__dirname, pathToRoot, 'models/token'));
  // Utilities
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);

  /**
   * Include Socket.IO.
   */
  const options = {
    /* Server capture path */
    //path: '/socket.io',
    /* Serve client files */
    //serveClient: false,
    /* below are engine.IO options */
    /* how many ms without a pong packet to consider the connection closed */
    //pingTimeout: 5000,
    /* how many ms before sending a new ping packet */
    //pingInterval: 25000,
    /* how many ms before an uncompleted transport upgrade is cancelled */
    //upgradeTimeout: 10000,
    // name of the HTTP cookie that contains the client sid to send as part of handshake response headers. Set to false to not send one. */
    cookie: false,
    /*transports to allow connections to */
    transports: ['websocket']
  };
  const chatNamespace = io(server, options).of('/chat'); 

  // socket.io authentication middleware
  chatNamespace.use(async (socket, next) => {
   const token = socket.handshake.query.token;
   if (!token) return next(new Error('Invalid socket request'));

   // verify token
   const validToken = jwtUtils.verify(token, 'refresh');
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