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
//const async = require('async')



const app = express();

// Get our API routes
const config = {
	db: require('./config/db'),
	authentication: require('./app/auth'),
	search: require('./app/search'),
	upload: require('./app/upload'),
	activity: require('./app/activity'),
	chat: require('./app/chat'),
	user: require('./app/user')
}

mongoose.connect(config.db.url);

//mongoose.connect("mongodb://uohbduorkfqofhp:3ZhDHgCpy75R1i0TULax@b6eo0yayiuwct4v-mongodb.services.clever-cloud.com:27017/b6eo0yayiuwct4v");
const feeds = require('./app/models/feeds');
const users = require('./app/models/user');
const room = require('./app/models/room');
// Parsers for POST data


//app.use(morgan('dev'));
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
app.use('/user', config.user);
app.use('/chat', config.chat);

//app.use('/profile', user);

const server = http.createServer(app);

var clients = []

const io = require('socket.io')(server);

app.io = io;

var nsp = io.of('/chat');
var service = io.of('/services');
nsp.use(sharedsession(session(cooky), {
	autoSave: true
}));

nsp.on('connection', function(socket){
	socket.emit('init');
	socket.on('join', room => {
		socket.join(room);
			}) 
		socket.on('msg', (data) =>{
			room
			.findOne({_id:data.roomid})
			.exec((err, chatRoom) => {
				chatRoom.chats.push({
					txt:data.txt,
					by:data.user,
					time:new Date()
				})
				chatRoom.save((err, theChatSaveRes) => {
					nsp.to(data.roomid).emit('msg', {
						txt:data.txt,
						user: data.user,
						time:new Date(),
						to:data.targetUser
					})
				})
				
			})
			
		})
}); 


service.on('connection', function(socket){ 

    socket.on('like' , post => {
    	console.log(post)
    	feeds
    	.findOne({_id:post.id})
    	.exec((err, res) => {
    		var found = false;
    		res.disabledFor.map((value, indexOf) => {
    			if(value = post.initiater) {
    				return found = true;
    			}
    		})
    		if(!found) {
    			res.likes = res.likes+1;
	    		res.disabledFor.push(post.initiater);
	    		res.save((err) => {
	    			socket.emit('disabled', post.id)
	    			console.info('{LIKED} : '+post.initiater)
	    		})
    		}
    		else {
    			socket.emit('disabled', post.id)
    		}
    		
    	})
    })
    socket.on('comment' , post => {
    	console.log(post)
    	feeds
    	.findOne({_id:post.id})
    	.exec((err, res) => {
    		
    			
	    		res.comments.push({user:post.initiater,comment:post.text,time:new Date()});
	    		res.save((err) => {
	    			socket.emit('commented', post)
	    			console.info('{COMMENTED} : '+post.initiater)
	    		})
    	
    	})
    })
});


// Catch all other routes and return the index file
app.get('/', (req, res) => {
	if(!req.session.user) {
		//req.flash('info','Redirecting...')
		res.render('login', {
			layout:false

		});
	}
	else {
	
	feeds
	.find({})
	.sort({timeago:1})
	.exec( (err,e) => {
	 
var finalData = e.map((val, index)=> {
	var disabled = false;
	val.disabledFor.map((userFound, indexOfUser) =>{
		if(userFound = req.session.user) return disabled = true;
	})
	var data={
				author:val.author,
				pudding:val.pudding,
				timeago:ta.ago(val.timeago),
				likes:val.likes,
				disabled:disabled,
				caption:val.caption,
				comments:val.comments,
				_id:val._id
			}
	return data

})	
//console.log(finalData)
	res.render('index', {
		layout:false,
		post: finalData.sort({timeago:1}),
		client: req.session.user
		})
	})	
	//.then(function(results) {
		
		
		
	//})
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
