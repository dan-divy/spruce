const io = require("socket.io");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const sio = io(server);
const Users = require("./user");
const Analytics = require("../models/analytics");

const { dev_key } = require("../../routes/developer/api");

console.log("Admin console ready for connection on port 4206");

sio.on("connection", function(socket) {
  socket.tries = 0;
  socket.authenticated = false;
  socket.on("password", function(password) {
    if (socket.tries > 4) {
      return socket.emit("wrong_password", socket.tries);
    }
    if (password == dev_key) {
      socket.authenticated = true;
      socket.emit("correct_password", password);
    } else {
      socket.tries++;
      socket.emit("wrong_password", socket.tries);
    }
  });
  socket.on("client_analytics", function() {
    Analytics.find({}, function(err, docs) {
      socket.emit("server_analytics", docs);
    });
  });
});

server.listen("4206");
