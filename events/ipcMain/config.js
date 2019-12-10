module.exports = function(mainWindow) {
  mainWindow.webContents.send("config", require("../../package.json"));
};
