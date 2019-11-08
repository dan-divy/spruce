const package = require("./package.json");

(function() {
  if (package.update == false) return;
  else console.log("checking for updates...");
})();
