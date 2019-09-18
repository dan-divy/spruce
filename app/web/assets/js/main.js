const backend = require("electron").ipcRenderer
function startSocket(key) {
    console.log(key)
    const socket = io($("#host").val());
    var authenticated;
    socket.on("connect", function() {
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

    socket.on("correct_password", function() {
        $("#password-div").fadeOut(function() {
            $("#main").fadeIn();
        });
    });

    socket.on("wrong_password", function(tries) {
        $("#password-div").fadeIn();
        $("#password-error").html("<span style=\"color: red\">Password was incorrect, " + (5-tries) + " tries left!</span>")
    });

    $("#password-button").click(function() {
        $("#password-error").html("")
        socket.emit("password", $("#password").val())
    });
}

function startSpruce() {
    backend.send("start_spruce")
    backend.on("key", function(event, key) {
        $("#connecting").fadeOut(function() {
            startSocket(key)
        });
    });
}


