var dbHost = process.env.dbHost || "localhost";

const dbAuth = false;
var dbUsername = "";
var dbPassword = "";
var dbCredentials = "";
if (dbAuth) {
	dbUsername = process.env.dbUsername || "sheldon";
	dbPassword = process.env.dbPassword || "supersecret";
	dbCredentials = dbUsername + ":" + dbPassword +"@";
}

module.exports = {
	"name":"oak",
	"title":"oak",
	"commands":{
		"package":"electron-packager electron.js oak --electronVersion=2.0.12 --overwrite --icon=/public/images/logo/logo.png --prune=true --out=release",
		"build":""
	},
	"http": {
		"host":"localhost",
		"port":8080
	},
	"author":"Robert Burckner",
	"version":"0.1.0",
	"db": {
		"connectionUri":"mongodb://" + dbCredentials + dbHost + ":27017/oak",
		"params": {},
		"collections": [
			"moment",
			"user",
			"feeling",
			"ask"
		]
	},
	"cookie": {
		"resave": true,
	  "secret": "<app secret>",
	  "expiresIn": new Date() * 60 * 60 * 24 * 7,
	  "saveUninitialized": true
	}
}
