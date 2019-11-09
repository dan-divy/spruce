const io = require("socket.io");
const server = require("../../bin/www").server;
const sio = io(server, { path: "/app" });
const Users = require("./user");
const path = require("path");
const { dev_key } = require("../../routes/developer/api");
const usage = require("usage");

console.log("Admin console ready for connection on route /app");

sio.on("connection", function(socket) {
  sock = socket;
  socket.tries = 0;
  socket.authenticated = false;
  socket.visitors = false;
  socket.on("password", function(password) {
    if (socket.tries > 4) {
      return socket.emit("wrong_password", socket.tries);
    }
    if (password == dev_key) {
      socket.authenticated = true;
      socket.emit("correct_password", password, require("../../config/app"));
      Users.getAll(function(err, users) {
        users.forEach(u => {
          u.password = null;
          u.profile_pic = path.join(__dirname, "/../../public/", u.profile_pic);
        });
        socket.emit("users", users);
        if (err) socket.emit("error", err.message || err.toString());
        socket.emit("fetch-users", users);
        socket.on("stats", function() {
          const Analytics = require("../models/analytics");
          if (!socket.authenticated) return;
          if (!socket.analytics)
            Analytics.data(function(keys, db) {
              let database = { online: db.connection.readyState };
              switch (db.connection.readyState) {
                case 0:
                  database.msg = "Disconnected";
                  break;
                case 1:
                  database.msg = "Connected";
                  break;
                case 2:
                  database.msg = "Connecting";
                  break;
                case 3:
                  database.msg = "Disconnecting";
                  break;
              }
              database.data = keys;
              if (database.data.length > 3) socket.analytics = true;
              socket.emit("database", database);
            });
          if (!socket.visitors) {
            Analytics.find(function(err, docs) {
              socket.emit("server_analytics", docs);
            });
            socket.visitors = true;
          }
          socket.emit(
            "sockets",
            Object.entries(require("./socket").sockets.connected).length
          );
          usage.lookup(process.pid, function(err, result) {
            if (err) return;
            socket.emit("cpu", result.cpu);
            socket.emit("ram", Math.round(result.memory * 0.000001));
          });
        });
        socket.on("shutdown", function() {
          if (!socket.authenticated) return;
          return process.exit(0);
        });
      });
    } else {
      socket.tries++;
      socket.emit("wrong_password", socket.tries);
    }
  });
});
