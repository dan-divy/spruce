var socket = io.connect('/chat')

    socket.on('connect', () => {
      console.log('connected');
    });

    socket.on('msg', data => {
      console.log(data);
      $("#chat-div").append('<ul class="list-group"><li class="list-group-item"><strong><a class="non-hoverable" href="/user/{{ username }}">'+data.txt+'</a></strong></li></ul>')
    });
function send() {
	var msgToSend = $("#chatBox").val();
	if(msgToSend !== '') {
		socket.emit('msg', {
			txt: msgToSend
		});	
	}
	
}