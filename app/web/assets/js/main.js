const backend = require("electron").ipcRenderer;
const copyToClipboard = require("electron").clipboard.writeText;
const shell = require("electron").shell;
var config;
var socket;
var connected;
var forced;
var graph = {};
if (localStorage.dev_key) {
  console.log(localStorage.dev_key);
  startSocket(localStorage.dev_key);
} else {
  $("#connecting").fadeIn();
}
function startSocket(key) {
  if (connected) return;
  console.log(key);
  socket = io($("#host").val());
  let i = setInterval(() => {
    if (connected || forced) return (forced = false);
    if (localStorage.dev_key) {
      localStorage.dev_key = "";
      delete localStorage.dev_key;
      $.notify("Unable to connect automatically");
    } else {
      $.notify("Unable to connect after 5s");
    }
    clearInterval(i);
    socket.disconnect() && socket.destroy();
    $("#connecting").fadeIn();
  }, 5000);
  socket.on("connect", function() {
    socket.emit("client_analytics");
    if (!connected) connected = true;
    else return;
    console.log(connecting);
    $.notify("Connected!", "success");
    if (key) {
      copyToClipboard(key);
      $.notify("Password copied to clipboard", "info");
    }
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
    });
  });

  socket.on("disconnect", function() {
    if (!connected) return;
    $("#main").fadeOut();
    $("#connecting").fadeIn();
    $.notify("Disconnected", "warning");
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

  socket.on("server_analytics", function(data) {
    console.log(data);
    const visitors = data.find(x => x.name == "visitors").stats;
    console.log(visitors);
    console.log(visitors.map(x => x.date));
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
        { name: "sessions", data: visitors.map(x => x.amount).reverse() }
      ],
      xaxis: {
        type: "category",
        categories: visitors.map(x => x.date).reverse()
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
    visitors.reverse();
    let yesterday =
      visitors.length - 2 >= 0 ? visitors[visitors.length - 2].amount : 0;
    let now = visitors[visitors.length - 1].amount;
    let percent = Math.round((yesterday / now) * 100);
    let increase = now - yesterday;
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
  setInterval(function() {
    socket.emit("stats");
  }, 2000);
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

function startSpruce() {
  $("#connecting").fadeOut();
  $.notify("Starting spruce...", "info");
  backend.send("start_spruce");
  backend.on("key", function(event, key) {
    $("#connecting").fadeOut(function() {
      startSocket(key);
    });
  });
}

function restartSpruce() {
  endSpruce();
  setTimeout(() => {
    startSpruce();
  }, 1000);
}

function endSpruce() {
  forced = true;
  $("#main").fadeOut(function() {
    $.notify("Stopping spruce...", "info");
    backend.send("end_spruce");
    $.notify("Sent stop signal to spruce", "success");
    $("#connecting").fadeIn();
    localStorage.dev_key = "";
    delete localStorage.dev_key;
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
