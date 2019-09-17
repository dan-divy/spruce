const socket = io("http://localhost:4206");

socket.on("connect", function() {
    $("#connecting").fadeOut(function() {
        $("#password-div").fadeIn()
    })
})

socket.on("correct_password", function() {
    document.body.innerHTML = "Password was correct!"
});

socket.on("wrong_password", function(tries) {
    $("#password-error").html("<span style=\"color: red\">Password was incorrect, " + (5-tries) + " tries left!</span>")
});

$("#password-button").click(function() {
    $("#password-error").html("")
    socket.emit("password", $("#password").val())
});