var socket = io.connect('/chat')

    socket.on('connect', () => {
      console.log('connected');
    });

    socket.on('msg', data => {
      console.log(data);
    });
function send() {
	var msgToSend = $("#chatBox").val();
	if(msgToSend !== '') {
		socket.emit('msg', {
			txt: msgToSend
		});	
	}
	
}