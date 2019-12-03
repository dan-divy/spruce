console.log(
  "Do not paste anything here unless told to by a developer of spruce. "
);
const backend = ipcRenderer;
var socket;
var connected;
var forced;
var graph = {};
var hostName;
var statsInt;
let slideQueue;
let pause;

$.notify = function(msg, type = "success", force) {
  console.log(msg);
  if (slideQueue) {
    clearTimeout(slideQueue);
  }
  slideQueue = setTimeout(() => {
    $("#notify_message").slideUp(600);
  }, 5000);

  $("#notify_message")
    .slideUp(600)
    .delay(700)
    .removeClass()
    .addClass("notify_message-" + type)
    .html("<center>" + msg + "</center>")
    .slideDown(600);
};

let runningSlide;

function loadPage(id) {
  if ($("#" + id).css("display") == "block") return;
  let pages = ["connecting", "download", "password-div", "main"];
  pages.forEach(x => (x != id ? $("#" + x).fadeOut() : true));
  $("#" + id)
    .delay(200)
    .fadeIn();
}

if (localStorage.dev_key) {
  startSocket(localStorage.dev_key, localStorage.host);
} else {
  loadPage("connecting");
  $.notify("Welcome to the Spruce App!", "success");
}
function startSocket(key, host = $("#host").val()) {
  if (connected) return;
  $.notify("Attempting to connect!", "warning");
  socket = io(host, { path: "/app" });
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
    socket = null;
    clearInterval(statsInt);
    loadPage("connecting");
  }, 7000);
  socket.on("connect", function() {
    console.log("CONNECT");
    if (!connected) connected = true;
    else return;
    socket.emit("client_analytics");
    $.notify("Connected to host", "success");
    $("#connecting").fadeOut(function(authenticated) {
      if (key) {
        return socket.emit("password", key);
      }
      if (!authenticated) {
        loadPage("password-div");
      } else {
        loadPage("main");
      }
    });
  });

  socket.on("correct_password", function(key, conf) {
    localStorage.dev_key = key;
    localStorage.host = host;
    hostName = host;
    $("#host-info").text(host.split("//")[1]);
    config = conf;
    $("#password-div").fadeOut(function() {
      loadPage("main");
      backend.send("check_update");
    });
  });

  socket.on("disconnect", function() {
    if (!connected) return;
    clearInterval(statsInt);
    loadPage("connecting");
    $.notify("Connection disconnected", "warning");
    clearInterval(statsInt);
    connected = false;
  });

  socket.on("wrong_password", function(tries) {
    if (localStorage.dev_key) {
      delete localStorage.dev_key;
      loadPage("connecting");
    } else {
      loadPage("password-div");
    }
    $("#password-error").html(
      '<span style="color: red">Password was incorrect, ' +
        (5 - tries) +
        " tries left!</span>"
    );
  });
  socket.on("fetch-users", function(data) {
    console.log("DATA", data);
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
    const visitors = data.find(x => x.name == "visitors")
      ? data.find(x => x.name == "visitors").stats
      : false;
    if (!visitors) return;
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
    if (value.toString().startsWith("-0")) value = 0;
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
  }, 1000);
  socket.on("sys-info", function(data) {
    data.forEach(s => {
      $("#" + s.name + "-info").text(s.value);
    });
  });
  socket.on("cpu", function(data) {
    changeStatus("cpu", data);
  });
  socket.on("database", function(data) {
    let count = 0;
    data.data.forEach(x => (count += x.count));
    changeStatus("database", count);
    $("#database-status").html(data.msg);
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
  });

  socket.on("users", function(users) {
    $("#users-body").html(
      users.map(
        u => `
    <tr>
      <td><img height="30" src="${host}${u.profile_pic ||
          "../spruce/spruce/public/images/logo/logo.png"}"></td>
      <td>${u.username}</td>
      <td>${u.firstname}</td>
      <td>${u.lastname}</td>
      <td>${u.bio}</td>
  </tr>`
      )
    );
    $("#users-table").DataTable({ responsive: !0, destroy: true });
  });

  socket.on("sockets", function(data) {
    changeStatus("now", data);
  });
  $("#password-button").click(function() {
    $("#password-error").html("");
    socket.emit("password", $("#password").val());
  });
}
let done;
backend.on("progress-error", function(event, err, fade) {
  if (fade) {
    loadPage("connecting");
  }
  $.notify(err, "danger");
  console.error(err);
});

backend.on("progress", (event, obj) => {
  let percent = parseInt(obj.progress * 100) / 100 + "%";
  if (done) return;
  loadPage("download");
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
  loadPage("connecting");
  $.notify("Spruce killed, kill code: " + code);
});
backend.on("update", function(e, yes) {
  if (!yes) return;
  $("#update-version").text(yes);
  loadPage("update");
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
    startSocket(localStorage.dev_key, localStorage.host);
  });
}

function endSpruce(cb) {
  forced = true;
  $("#main").fadeOut(function() {
    clearInterval(statsInt);
    $.notify("Stopping spruce...", "warning");
    socket.emit("shutdown");
    loadPage("connecting");
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
  delete localStorage.dev_key;
  loadPage("connecting");
}

function openBrowser(def) {
  if (def) {
    return shell.openExternal("https://github.com/dan-divy/spruce");
  }
  let link = `${hostName}`;
  shell.openExternal(link);
}
