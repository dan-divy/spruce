var dbHost = process.env.dbHost || "localhost";
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
		"connectionUri":"mongodb://"+dbHost+":27017/oak",
		"params": {},
		"collections": [
			"moment",
			"user",
			"feeling",
			"ask"
		]
	}
}
