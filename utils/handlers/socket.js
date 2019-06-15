const io = require('socket.io');
const express = require('express');
var Room = require("../models/room");
const sio = require('../../bin/www').sio; 
const sessionMiddleware = require('../../app').sessionMiddleware;



sio.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

function sendMsg(socket, chat) {
    var time = new Date();
    var room = socket.room;
    if(!room.chats) {
        room.chats = [];
    }
    room.chats.push({txt:chat.txt, by: socket.session.user._id, time})
    room.save((err,obj) => {
        socket.broadcast.emit("new msg", {
            txt:chat.txt,
            by:socket.session.user._id,
            time
        });
    });
};

sio.on("connection", function(socket) {
    const session = socket.request.session
    socket.session = session;
    Room
    .findOne({id: session.socket.room}, function (err, room) {
        if(!room) {
            return socket.disconnect('unauthorized');
        }
        socket.room = room; 
    });
    socket.on('msg', function(data) {
        sendMsg(socket, data);        
    });
});

module.exports = io;