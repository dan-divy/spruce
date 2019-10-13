const sio = require("../bin/www").sio;
console.log("Socket ready for connections");
sio.on("connection", function(socket) {

});

module.exports = sio;
