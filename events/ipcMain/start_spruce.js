const fs = require("file-system");
const nodeGit = require("nodegit");
const npm = require("npm");
const path = require("path");

function pathJoin(...where) {
  where = where.join("/");
  return path.resolve(where);
}

module.exports = function(mainWindow, app) {
  let available = true;
  try {
    fs.readFileSync(pathJoin(app.getPath("appData") + "/spruce/bin/www"));
  } catch (err) {
    available = false;
  }
  if (available) {
    let proc = require("child_process").fork(
      pathJoin(app.getPath("appData"), "spruce/bin/www"),
      ["--app"],
      {
        detached: true,
        silent: true
      }
    );
    let { pid, stdout, stderr } = proc;
    stdout.on("data", function(data) {
      data = data.toString();
      if (
        data.split("Developer key: ").length &&
        data.split("Developer key: ").length > 1
      ) {
        console.log(data);
        mainWindow.webContents.send(
          "key",
          data.split("Developer key: ")[1].split("\n")[0]
        );
      } else {
        console.log(data);
      }
    });
    stderr.on("data", function(data) {
      data = new Error(data.toString());
      if (data.message.split("current Server Discovery").length > 1) return; //mongo err
      console.error(data);
      //console.error(data);
      mainWindow.webContents.send("error", data.toString());
    });
    proc.on("exit", function(code) {
      mainWindow.webContents.send("killed", code);
    });
    console.log(pid);
  } else {
    try {
      fs.rmdirSync(pathJoin(app.getPath("appData"), "spruce"));
    } catch (err) {}
    console.log("Downloading...");
    nodeGit
      .Clone(
        "https://github.com/dan-divy/spruce",
        pathJoin(app.getPath("appData"), "spruce"),
        {
          bare: false,
          checkoutBranch: "master",
          fetchOpts: {
            callbacks: {
              transferProgress: function(stats) {
                const progress =
                  (100 * (stats.receivedObjects() + stats.indexedObjects())) /
                  (stats.totalObjects() * 2);
                mainWindow.webContents.send("progress", {
                  name: "git",
                  progress
                });
              }
            }
          }
        }
      )
      .then(function() {
        mainWindow.webContents.send("progress", {
          name: "git",
          progress: 100
        });
        mainWindow.webContents.send("progress", {
          name: "npm",
          progress: 0
        });
        setTimeout(() => {
          npm.load(
            {
              prefix: pathJoin(app.getPath("appData"), "spruce")
            },
            function() {
              mainWindow.webContents.send("progress", {
                name: "npm",
                progress: 50
              });
              npm.commands.install(function(err, result) {
                if (err) {
                  return mainWindow.webContents.send(
                    "progress-error",
                    err.toString(),
                    true
                  );
                }
                mainWindow.webContents.send("progress", {
                  name: "npm",
                  progress: 100,
                  done: true
                });
              });
            }
          );
          mainWindow.webContents.send("progress", {
            name: "npm",
            progress: 25
          });
        }, 1000);
      })
      .catch(err => {
        mainWindow.webContents.send("progress-error", err.toString(), true);
      });
  }
};
