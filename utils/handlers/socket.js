const io = require("socket.io");
var User = require("../models/user");
var Room = require("../models/room");
const sio = require("../../bin/www").sio;
const sessionMiddleware = require("../../app").sessionMiddleware;

sio.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

function type(socket) {
  User.findOne({ _id: socket.session._id }).exec(function(err, u) {
    socket
      .to(socket.session.socket.room)
      .emit("typing", { username: u.username });
  });
}

function sendMsg(socket, chat) {
  var time = new Date();
  var room = socket.room;
  if (!room.chats) {
    room.chats = [];
  }
  User.findOne({ _id: socket.session._id }).exec(function(err, u) {
    const user = {
      username: u.username,
      profile_pic: u.profile_pic,
      _id: u._id
    }; //hide stuff like password
    room.chats.push({ txt: chat.txt, by: user, time });
    console.log({ txt: chat.txt, by: user, time });
    room.save((err, obj) => {
      sio.to(socket.session.socket.room).emit("new msg", {
        txt: chat.txt,
        by: user,
        time
      });
    });
  });
}

sio.on("connection", function(socket) {
  const session = socket.request.session;
  socket.session = session;
  socket.join(session.socket.room);
  Room.findOne({ _id: session.socket.room }, function(err, room) {
    if (!room) {
      return socket.disconnect("unauthorized");
    }
    socket.room = room;
  });
  socket.on("msg", function(data) {
    sendMsg(socket, data);
  });
  socket.on("typing", function(data) {
    type(socket);
  });
});

module.exports = io;
