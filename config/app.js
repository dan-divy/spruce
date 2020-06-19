var dbHost = process.env.dbHost || "localhost";
module.exports = {
	"name":"spruce",
	"title":"spruce",
	"commands":{
		"package":"electron-packager electron.js spruce --electronVersion=2.0.12 --overwrite --icon=/public/images/logo/logo.png --prune=true --out=release",
		"build":""
	},
	"http": {
		"host":"localhost",
		"port":8000
	},
	"author":"Divy Srivastava",
	"version":"2.0.0",
	"db": {
		"connectionUri":"mongodb://thoughtlotto:B3arcats!2#45@ds155614.mlab.com:55614/heroku_d9fqbm16",
		//"connectionUri":"mongodb://"+dbHost+":27017/spruce",
		"params": {},
		"collections": [
			"moment",
			"user",
			"feeling",
			"ask"
		]
	}
}
