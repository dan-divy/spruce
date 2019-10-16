console.log(
  "Do not paste anything here unless told to by a developer of spruce. "
);
const backend = require("electron").ipcRenderer;
const shell = require("electron").shell;
var config;
var socket;
var connected;
var forced;
var graph = {};
var statsInt;
$.notify = function(msg, type = "success") {
  $("#notify_message").removeClass();
  $("#notify_message").addClass("notify_message-" + type);
  $("#notify_message").html("<center>" + msg + "</center>");
  $("#notify_message")
    .slideDown(600)
    .delay(3000)
    .slideUp(600);
};
$.notify("Welcome to the Spruce App!", "success");
if (localStorage.dev_key) {
  console.log("Attempt Key: " + localStorage.dev_key);
  startSocket(localStorage.dev_key);
} else {
  $("#connecting").fadeIn();
}
function startSocket(key) {
  if (connected) return;
  $.notify("Attempting to connect!", "success");
  console.log("Connected: " + key);
  socket = io($("#host").val());
  setTimeout(() => {
    if (connected || forced) return (forced = false);
    if (localStorage.dev_key) {
      localStorage.dev_key = "";
      delete localStorage.dev_key;
      $.notify("Unable to connect automatically", "danger");
    } else {
      $.notify("Unable to connect after 7s", "danger");
    }
    socket.disconnect() && socket.destroy();
    $("#connecting").fadeIn();
  }, 7000);
  socket.on("connect", function() {
    socket.emit("client_analytics");
    if (!connected) connected = true;
    else return;
    console.log(connecting);
    $.notify("Connected!", "success");
    $("#connecting").fadeOut(function(authenticated) {
      if (key) {
        return socket.emit("password", key);
      }
      if (!authenticated) {
        $("#password-div").fadeIn();
      } else {
        $("#main").fadeIn();
      }
    });
  });

  socket.on("correct_password", function(key, conf) {
    localStorage.dev_key = key;
    config = conf;
    $("#password-div").fadeOut(function() {
      $("#main").fadeIn();
      backend.send("check_update");
    });
  });

  socket.on("disconnect", function() {
    if (!connected) return;
    clearInterval(statsInt);
    $("#main").fadeOut();
    $("#connecting").fadeIn();
    $.notify("Connection disconnected", "warning");
    clearInterval(statsInt);
    connected = false;
  });

  socket.on("wrong_password", function(tries) {
    if (localStorage.dev_key) {
      delete localStorage.dev_key;
      $("#connecting").fadeIn();
    } else {
      $("#password-div").fadeIn();
    }
    $("#password-error").html(
      '<span style="color: red">Password was incorrect, ' +
        (5 - tries) +
        " tries left!</span>"
    );
  });
  socket.on("fetch-users", function(data) {
    console.log("DATA", data)
    $("#data-users").html(
      data.map(
        u => `
      <tr>
        <td><img height="40" src="${u.profile_pic}"></td>
        <td>${u.username}</td>
        <td>${u.firstname + " " + u.lastname}</td>
        <td>${u.dob}</td>
        <td>${u.posts.length}</td>
      </tr>`
      )
    );
    $("#user-table").DataTable({ responsive: !0 });
    $('input[type="search"], select').addClass("form-control");
  });
  socket.on("server_analytics", function(data) {
    console.log(data);
    const visitors = data.find(x => x.name == "visitors")
      ? data.find(x => x.name == "visitors").stats
      : false;
    if (!visitors) return;
    console.log(visitors);
    console.log(visitors.map(x => x.date));
    visitors.sort((x, y) => {
      return (
        x.date.split("-")[x.date.split("-").length - 1] -
        y.date.split("-")[y.date.split("-").length - 1]
      );
    });
    const options = {
      chart: { type: "area", height: 152, sparkline: { enabled: !0 } },
      colors: ["#3ac47d"],
      stroke: { width: 5, curve: "smooth" },
      markers: { size: 1 },
      tooltip: {
        fixed: { enabled: !1 },
        y: {
          title: {
            formatter: function(t) {
              return "";
            }
          }
        },
        marker: { show: !1 }
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 90, 100]
        }
      },
      series: [
        {
          name: "sessions",
          data: visitors
            .map(x => x.amount)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        }
      ],
      xaxis: {
        type: "category",
        categories: visitors
          .map(x => x.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      },
      yaxis: {
        min: 0
      }
    };
    if (graph["visitors"]) graph["visitors"].destroy();
    graph["visitors"] = new ApexCharts(
      document.querySelector("#visitors"),
      options
    );
    graph["visitors"].render();
    let yesterday =
      visitors.length - 2 >= 0 ? visitors[visitors.length - 2].amount : 0;
    let now = visitors[visitors.length - 1].amount;
    let increase = now - yesterday;
    let percent = Math.round((increase / yesterday) * 100);
    console.log(now, yesterday);
    $("#graph-daily").text(percent);
    if (increase >= 0) {
      var symbol = "+";
      $("#graph-daily-amount").addClass("text-success");
    } else {
      $("#graph-daily-amount").removeClass("text-success");
      $("#graph-daily-amount").addClass("text-danger");
      $("#graph-daily-arrow").removeClass("fa-angle-up");
      $("#graph-daily-arrow").addClass(["fa-angle-down", "text-danger"]);

      var symbol = "";
    }
    $("#graph-daily-amount").text(symbol + increase);
  });
  function changeStatus(name, value) {
    const color = $(`#${name}-color`);
    const face = $(`#${name}-icon`);
    const text = $(`#${name}-status`);
    function emotion(good) {
      if (good) {
        text.text("Good");
        face.removeClass("fa-frown");
        face.addClass("fa-smile");
        color.removeClass("text-danger");
        color.addClass("text-success");
      } else {
        text.text("Bad");
        face.removeClass("fa-smile");
        face.addClass("fa-frown");
        color.removeClass("text-success");
        color.addClass("text-danger");
      }
    }
    let ending = $(`#${name}`).attr("data-units");
    if (ending.endsWith("s")) {
      ending = value != 1 ? ending : ending.slice(0, -1);
    }
    $(`#${name}`).text(value + ending);
    switch (name) {
      case "ram":
        if (value < 300) {
          emotion(true);
        } else {
          emotion(false);
        }
        break;
      case "cpu":
        if (value < 20) {
          emotion(true);
        } else {
          emotion(false);
        }
        break;
      case "database":
        emotion(true);
        break;
    }
  }
  socket.emit("stats");
  statsInt = setInterval(function() {
    socket.emit("stats");
  }, 1000);
  socket.on("cpu", function(data) {
    changeStatus("cpu", data);
    let current_datetime = new Date();
    let formatted_date =
      current_datetime.getFullYear() +
      "-" +
      (current_datetime.getMonth() + 1) +
      "-" +
      current_datetime.getDate() +
      ", " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes() +
      ":" +
      current_datetime.getSeconds();
    $("#stats-status").html("Connected at " + formatted_date);
  });
  socket.on("database", function(data) {
    let count = 0;
    console.log(data.data);
    data.data.forEach(x => (count += x.count));
    changeStatus("database", count);
    $("#database-status").html(data.msg);
    let current_datetime = new Date();
    let formatted_date =
      current_datetime.getFullYear() +
      "-" +
      (current_datetime.getMonth() + 1) +
      "-" +
      current_datetime.getDate() +
      ", " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes() +
      ":" +
      current_datetime.getSeconds();
    $("#stats-status").html("Connected at " + formatted_date);
    let a = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z"
    ];
    data.data.sort(
      (o, t) =>
        a.indexOf(o.name[0].toUpperCase()) - a.indexOf(t.name[0].toUpperCase())
    );
    $("#database-docs").html(
      data.data.map(model => {
        let upper = model.name[0].toUpperCase();
        model.name = model.name.slice(1);
        model.name = upper + model.name;
        model.name += model.name.endsWith("s") ? "" : "s";
        return `<li class="bg-transparent list-group-item">
            <div class="widget-content p-0">
                <div class="widget-content-outer">
                    <div class="widget-content-wrapper">
                        <div class="widget-content-left">
                            <div class="widget-heading">${model.name}</div>
                        </div>
                        <div class="widget-content-right">
                            <div class="widget-numbers text-primary">${
                              model.count
                            } ${model.count != 1 ? "docs" : "doc"}</div>
                        </div>
                    </div>
                </div>
            </div>
          </li>`;
      })
    );
  });
  socket.on("ram", function(data) {
    changeStatus("ram", data);
    let current_datetime = new Date();
    let formatted_date =
      current_datetime.getFullYear() +
      "-" +
      (current_datetime.getMonth() + 1) +
      "-" +
      current_datetime.getDate() +
      ", " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes() +
      ":" +
      current_datetime.getSeconds();
    $("#stats-status").html("Connected at " + formatted_date);
  });
  socket.on("sockets", function(data) {
    changeStatus("now", data);
    let current_datetime = new Date();
    let formatted_date =
      current_datetime.getFullYear() +
      "-" +
      (current_datetime.getMonth() + 1) +
      "-" +
      current_datetime.getDate() +
      ", " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes() +
      ":" +
      current_datetime.getSeconds();
    $("#stats-status").html("Connected at " + formatted_date);
  });
  $("#password-button").click(function() {
    $("#password-error").html("");
    socket.emit("password", $("#password").val());
  });
}
let done;
backend.on("progress-error", function(event, err, fade) {
  if (fade) {
    $("#download").fadeOut();
    $("#connecting").fadeIn();
  }
  $.notify(err, "danger");
  console.error(obj);
});
backend.on("progress", (event, obj) => {
  if (done) return;
  let percent = parseInt(obj.progress * 100) / 100 + "%";
  $("#download").fadeIn();
  $("#connecting").fadeOut();
  $("#download-progress").attr(
    "aria-valuenow",
    Math.round(parseInt(obj.progress) * 100) / 100
  );
  $("#download-progress").css("width", percent);
  $("#download-percent").text(percent);
  if (obj.name == "git") {
    $("#download-name").text("Spruce is downloading the latest version...");
  }
  if (obj.name == "npm") {
    $("#download-name").text("Spruce is downloading the latest packages...");
  }
  if (obj.name == "npm" && obj.done) {
    done = true;
    $("#download").fadeOut();
    startSpruce();
  }
});
backend.on("error", function(e, err) {
  console.error(err);
  console.log(err.split("Error:").length > 2);
  let error =
    err.split("Error:").length > 2
      ? "Error: " + err.split("Error:")[2].split("\n")[0]
      : err;
  error = error.length > 50 ? error.slice(0, 50) + "..." : error;
  $.notify(error, "danger");
});
backend.on("killed", function(e, code) {
  $("#main").fadeOut();
  $("#connecting").fadeIn();
  $.notify("Spruce killed, kill code: " + code);
});
backend.on("update", function(e, yes) {
  if (!yes) return;
  $("#update-version").text(yes);
  $("#update").fadeIn();
  $("#update-btn").on("click", function() {
    $("#update").html(
      'Are you sure? <a id="update-yes">Yes</a>, <a id="update-no" style="margin-left:0">No</a>'
    );
    $("#update-yes").on("click", function() {
      $("#update").fadeOut();
      $("#main").fadeOut();
      backend.send("run_update");
    });
    $("#update-no").on("click", function() {
      $("#update").fadeOut();
    });
  });
});

function startSpruce() {
  $("#connecting").fadeOut();
  $.notify("Starting spruce...", "warning");
  backend.send("start_spruce");
  backend.on("key", function(event, key) {
    $("#connecting").fadeOut(function() {
      startSocket(key);
    });
  });
}

function restartSpruce() {
  endSpruce(function() {
    socket.destroy();
    startSpruce();
  });
}

function endSpruce(cb) {
  forced = true;
  $("#main").fadeOut(function() {
    clearInterval(statsInt);
    $.notify("Stopping spruce...", "warning");
    socket.emit("shutdown");
    $("#connecting").fadeIn();
    localStorage.dev_key = "";
    delete localStorage.dev_key;
    socket.on("disconnect", function() {
      if (cb) cb();
    });
    socket.disconnect() && socket.destroy();
  });
}

function logout() {
  forced = true;
  socket.destroy();
  socket.disconnect();
  $("#main").fadeOut(function() {
    $("#connecting").fadeIn();
  });
}

function openBrowser(def) {
  if (def) {
    shell.openExternal("https://github.com/dan-divy/spruce");
  }
  shell.openExternal(`http://${config.http.host}:${config.http.port}`);
}
