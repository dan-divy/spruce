const dbHost = process.env.dbHost || "localhost";

const dbAuth = process.env.abAuth || false;
var dbUsername = "";
var dbPassword = "";
var dbCredentials = "";
if (dbAuth) {
	dbUsername = process.env.dbUsername || "sheldon";
	dbPassword = process.env.dbPassword || "supersecret";
	dbCredentials = dbUsername + ":" + dbPassword + "@";
}
const appSecret = process.env.appSecret || "appSecret";

module.exports = {
	"env": "development", // production or development
	"name": "oak",
	"title": "oak",
	"privateFiles": "files",
	"commands": {
		"package": "electron-packager electron.js oak --electronVersion=2.0.12 --overwrite --icon=/public/images/logo/logo.png --prune=true --out=release",
		"build": ""
	},
	"http": {
		"host": "localhost",
		"port": 8080
	},
	"author": "Robert Burckner",
	"version": "0.1.4",
	"db":  {
		"connectionUri": "mongodb://" + dbCredentials + dbHost + ":27017/oak",
		"host": dbHost,
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
	  "secret": appSecret,
	  "expiresIn": new Date() * 60 * 60 * 24 * 7,
	  "saveUninitialized": true
	},
	"redis": {
  	"host": "localhost",
  	"port": 6379
  }
}
