const socket = io("http://localhost:4206");

socket.on("connect", function() {
    console.log("HI")
})

socket.on("correct_password", function() {
    document.body.innerHTML = "Password was correct!"
});

socket.on("wrong_password", function(tries) {
    document.body.innerHTML = "Password was incorrect, " + (5-tries) + " tries left!"
});