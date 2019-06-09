const io = require('socket.io');
const express = require('express');
const server = require('../../bin/www')
var sio = io(server);
const sessionMiddleware = require('../../app').sessionMiddleware;

sio.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

sio.on("connection", function(socket) {
    console.log(socket.request.session);
    socket.on('')
});

module.exports = io;