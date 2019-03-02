var appId ="924a192c-7a4e-425d-a84e-15b2a3504c70";
var sendNotification = function(data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Basic MjU3MWNkZWItZmI4YS00ZThkLTllZWQtYmQ0MDcxM2M2MmI3"
  };
  
  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };
  
  var https = require('https');
  var req = https.request(options, function(res) {  
    res.on('data', function(data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();
};

function sendNotificationAll(message) {
	sendNotification({
		app_id:appId,
		contents: {
			"en":message
		},
		included_segments: ["All"]
	})
}
	

module.exports = {
	broadcast:sendNotificationAll
}