// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require('fs');
const mongoose = require('mongoose'); 
const ta = require('time-ago');
const session = require('express-session');
const sharedsession = require("express-socket.io-session");
const hbs = require('express-handlebars')
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const app = express();

// Get our API routes
const config = {
	db: require('./config/db'),
	authentication: require('./app/auth'),
	search: require('./app/search'),
	upload: require('./app/upload'),
	activity: require('./app/activity'),
	chat: require('./app/chat')
}

mongoose.connect(config.db.url);

//mongoose.connect("mongodb://uohbduorkfqofhp:3ZhDHgCpy75R1i0TULax@b6eo0yayiuwct4v-mongodb.services.clever-cloud.com:27017/b6eo0yayiuwct4v");
const feeds = require('./app/models/feeds');
const users = require('./app/models/user');
// Parsers for POST data



app.use(cookieParser());

var cooky = {
	secret: 'work hard',
  	resave: true,
  	expires: new Date() * 60 * 60 * 24 * 7,
  	saveUninitialized: true
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', 1) // trust first proxy
app.use(flash())
app.use(session(cooky))

app.set('view engine', 'hbs'); 
app.engine( 'hbs', hbs( { 
	extname: '.hbs'
}));

// Point static path to dist
app.use(express.static(path.join(__dirname, './bin')));

// Set our routes
app.use('/auth', config.authentication);
app.use('/upload', config.upload);
app.use('/search', config.search);
app.use('/activity', config.activity);
app.use('/chat', config.chat);

//app.use('/profile', user);

const server = http.createServer(app);

var clients = []

const io = require('socket.io')(server);

app.io = io;

	var nsp = io.of('/chat');
	nsp.use(sharedsession(session(cooky), {
    autoSave: true
	}));
	
	nsp.on('connection', function(socket){
		socket.emit('init');
		 
  		socket.on('msg', (data) =>{
  			nsp.emit('msg', {
  				txt:data.txt,
  				user: data.user,
  				time:new Date()
  			})
  		})
	}); 


io.on('connection', function(client){ 
    clients.push(client);
});



// Catch all other routes and return the index file
app.get('/', (req, res) => {
	if(!req.session.user) {
		res.redirect('/auth/login');
	}
	else {
	feeds
	.find({})
	.exec(function(err,results) {
		var posts = []
		results.map(function (post, index) {
		users
		.findOne({username:post.author})
		.exec((err, id) => {
			posts.push({
				author:post.author,
				likes:post.likes,
				url:post.pudding,
				id:post._id,
				caption:post.caption,
    			tags: post.tags,
    			type: post.type,
    			disabledFor:post.disabledFor,
    			comments:post.comments,
    			time:post.time,
    			dp: id.profilePic,
    			timeago:ta.ago(post.timeago)
			});
		
		})
		
		});	
	res.render('index', {
		layout : false,
		post : posts
	})
	
	});
	}
  
	
});

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '2374';
app.set('port', port);

/**
 * Create HTTP server.
 */


/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));
