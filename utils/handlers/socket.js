const io = require('socket.io');
const express = require('express');
var User = require('../models/user');
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
    User.findOne({_id: socket.session._id})
        .exec(function(err, user) {
        room.chats.push({txt:chat.txt, by: user, time})
        console.log({txt:chat.txt, by: user, time})
        room.save((err,obj) => {
            socket.broadcast.emit("new msg", {
                txt:chat.txt,
                by:user,
                time
            });
        });
    })
};

sio.on("connection", function(socket) {
    const session = socket.request.session
    socket.session = session;
    Room
    .findOne({_id: session.socket.room}, function (err, room) {
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