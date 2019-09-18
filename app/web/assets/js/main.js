function startSocket() {
    const socket = io($("#host").val());
    var authenticated;
    socket.on("connect", function() {
        $("#connecting").fadeOut(function(authenticated) {
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
        $("#password-error").html("<span style=\"color: red\">Password was incorrect, " + (5-tries) + " tries left!</span>")
    });

    $("#password-button").click(function() {
        $("#password-error").html("")
        socket.emit("password", $("#password").val())
    });
}

function startSpruce() {
    require("electron").ipcRenderer.send("start_spruce")
    $("#connecting").fadeOut(function() {
        startSocket()
    });
}


