const io = require("socket.io");
const express = require("express")
const app = express();
const http = require("http");
const server = http.createServer(app);
const sio = io(server);
const Users = require("./user")
const { dev_key } = require("../../routes/developer/api");

sio.on("connection", function(socket) {
    socket.tries = 0;
    socket.authenticated = false;
    socket.on("password", function(obj) {
        if(obj.password == dev_key && socket.tries < 6) {
            socket.authenticated = true;
            socket.emit("correct_password")
        } else {
            socket.tries++;
            socket.emit("wrong_password", socket.tries)
        }
    })
});

server.listen("4206")

