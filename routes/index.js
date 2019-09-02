'use strict';
const array_tools = require("array-tools");
const express = require('express');
const ta = require('time-ago');

const router = express.Router();

const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('a4c4e845fea64f9e9c72541aa354a29e').v2;

const user = require('../utils/handlers/user');

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
        var lastSeen = ta.ago(req_user.lastLogin);
        //console.log(posts)
        res.render('index', {
          user: req_user,
          title: req.app.conf.name,
          fileRepo: "/api/v1/file",
          lastSeen: lastSeen,
          people: users,
          posts: true
        });
      })
     });
    }
  else {
    res.render('auth/login', {
      title: req.app.conf.name,
      error:false
    });
  }
});

module.exports = router;
