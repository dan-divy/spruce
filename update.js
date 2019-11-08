const package = require("./package.json");
const exec = require("child_process").exec;
const prompts = require("prompts");

let oldlog = console.log;
console.log = function(...args) {
  return oldlog("spruce update: " + args);
};

async function ask(question, cb) {
  prompts({
    type: "text",
    name: "value",
    message: question + " (y,n)",
    validate: value =>
      value != "y" && value != "n" ? `Please answer with y or n` : true
  })
    .then(function(data) {
      cb(false, data.value == "y" ? true : false);
    })
    .catch(function(err) {
      cb(new Error(err));
    });
}

async function checkForChanges(cb) {
  exec(
    "git remote add spruce https://github.com/dan-divy/spruce; git fetch spruce; git rev-list HEAD...spruce/master; git remote remove spruce",
    function(err, data) {
      if (!data || err) return cb(err || true);
      else cb(false, data);
    }
  );
}

(function() {
  if (package.update == false) return;
  else console.log("checking for updates...");

  checkForChanges(function(err, data) {
    if (err != true && err) return console.error(err);
    if (err == true) return console.log("all up to date");
    console.clear();
    const commits = data.split("\n");
    console.log(commits.length + " updates found");
    ask("Install updates?", function(err, install) {
      if (err) return console.error(err);
      if (!install) return console.log("aborting install");
    });
  });
})();
