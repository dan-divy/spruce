var express = require('express');
var router = express.Router();
var user = require('../utils/handlers/user');
var ta = require('time-ago');
var array_tools = require("array-tools");
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('a4c4e845fea64f9e9c72541aa354a29e').v2;
/* GET home page. */


router.get('/', function(req, res, next) {
  if(req.session._id && req.session.user) {
  	user.getAll((err, users) => {
  			for(var i=0;i<users.length;i++) {

          for(var j=0;j<users[i].posts.length;j++) {
           users[i].posts[j].timeago = ta.ago(users[i].posts[j].createdAt);
           }
        }
         var posts = [];
        user.findOne({username:req.session.user}, (error, req_user) => {
       /*   for(var z=0;z<req_user.followers.length;z++) {
            user.findOne({_id:req_user.followers[z]}, (e,followedUser) => {
              posts.push(followedUser.posts)
            })
          }
          */
          var lastSeen = ta.ago(req_user.lastLogin);
          //console.log(posts)
          res.render('index', {
            user:req_user,
            title: req.app.conf.name,
            lastSeen:lastSeen,
            people: users,
            posts:true
          });
        })

		 });

		}
  else {

  	 res.render('auth/login', {
  		title: req.app.conf.name,
  		error:false
  	  })


  }
});

module.exports = router;
