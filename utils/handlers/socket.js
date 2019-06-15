const io = require('socket.io');
const express = require('express');
var Room = require("../models/room");
const {sio} = require('../../bin/www'); 
const sessionMiddleware = require('../../app').sessionMiddleware;

sio.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

function sendMsg(socket, chat) {
    var time = new Date();
    var room = socket.room;
    room.chats.push({txt:chat.txt, by: socket.request.session.user._id, time})
    room.save((err,obj) => {
        return true;
        socket.broadcast.emit("new msg", {
            txt:chat.txt,
            by:socket.request.session.user.username,
            time   
        });
    });
};

sio.on("connection", function(socket) {
    Room
    .find({room: socket.request.session.socket.room}, function (err, room) {
        if(!room) {
            return socket.disconnect('unauthorized');
        }
        socket.room = room; 
    });
    socket.on('msg', function(data) {
        sendMsg(socket, data);        
    });
});

/**
 * Pushpushpushpushpush
 */
module.exports = io;