const backend = require("electron").ipcRenderer
if(localStorage.dev_key) {
    console.log(localStorage.dev_key)
    startSocket(localStorage.dev_key)
} else {
    $("#connecting").fadeIn()
}
function startSocket(key) {
    $.notify("Connecting...", "info")
    console.log(key)
    const socket = io($("#host").val());
    var authenticated;
    var connected;
    setTimeout(() => {
        if(!connected) {
            if(localStorage.dev_key) {
                delete localStorage.dev_key;
                $.notify("Unable to connect automatically")
            } else {
                $.notify("Unable to connect after 5s")
            }
            socket.destroy();
            $("#connecting").fadeIn()
        }
    }, 5000)
    socket.on("connect", function() {
        if(!connected) connected = true
            else return;
        console.log(connecting)
        $.notify("Connected!", "success")
        $("#connecting").fadeOut(function(authenticated) {
            if(key) {
                return socket.emit("password", key)
            }
            if(!authenticated) {
                $("#password-div").fadeIn();
            } else {
                $("#main").fadeIn();
            }
        })
    })

    socket.on("correct_password", function(key) {
        localStorage.dev_key = key;
        $("#password-div").fadeOut(function() {
            $("#main").fadeIn();
        });
    });

    socket.on("disconnect", function() {
        $.notify("Disconnected, attempting to reconnect...", "warning")
    })

    socket.on("wrong_password", function(tries) {
        if(localStorage.dev_key) {
            delete localStorage.dev_key
            $("#connecting").fadeIn()
        } else {
            $("#password-div").fadeIn()
        }
        $("#password-error").html("<span style=\"color: red\">Password was incorrect, " + (5-tries) + " tries left!</span>")
    });

    $("#password-button").click(function() {
        $("#password-error").html("")
        socket.emit("password", $("#password").val())
    });
}

function startSpruce() {
    $("#connecting").fadeOut()
    $.notify("Starting spruce...", "info")
    backend.send("start_spruce")
    backend.on("key", function(event, key) {
        $.notify("Logging in...", "info")
        $("#connecting").fadeOut(function() {
            startSocket(key)
        });
    });
}


