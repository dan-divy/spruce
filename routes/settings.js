'use strict';
const createError = require('http-errors');
const express = require('express');
const fs = require('file-system');
const guid = require('guid');
const mv = require('mv');
const mime = require('mime-types')
const mongoose = require("mongoose");
const path = require('path');
const router = express.Router();

const user = require('../utils/handlers/user');

const MyFile = require("../utils/models/file");

const formParser = require('../utils/form-parser.js');

//const image_types = ["png","jpeg","gif"];

mongoose.connect(require("../config/app").db.connectionUri, {
  useNewUrlParser: true
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  user.findOne({_id:req.session._id}, (err, user) => {
    res.render('me/index', {
      title: req.app.conf.name,
      user: user
    });
  });
});

router.get('/settings', function(req, res, next) {
  user.findOne({_id:req.session._id}, (err, user) => {
    res.render('me/settings', {
      title: req.app.conf.name,
      user: user
    });
  });
});

router.get('/activity', function(req, res, next) {
  user.findOne({_id:req.session._id}, (err, user) => {
    res.render('me/activity', {
      title: req.app.conf.name,
      activity: user.notifications
    });
  });
});

router.get('/post/:action/:query', function(req, res, next) {
  switch (req.params.action) {
    case "edit":
      res.render('index');
      break;
    case "delete":
      user.findOne({username:req.session.user}, (err, u) => {
        let id = req.params.query
        if (u.posts[u.posts.indexOf(u.posts.find(x => x._id == id))].static_url) {
          fs.unlinkSync('./public' + u.posts[u.posts.indexOf(u.posts.find(x => x._id == id))].static_url);
        }
        u.posts.splice(u.posts.indexOf(u.posts.find(x => x._id == id)), 1);
        u.save(err => {
          if (err) throw err;
          console.log('Post deleted');
          res.redirect('/')
        });
      });
      break;
    default: 
      res.send("hi");
  }
});

router.get('/upload', function(req, res, next) {
    res.render('upload/file-upload', {
      title:req.app.conf.name,
      user: req.session.user
    });
});

// Adding a new file
router.post('/upload', formParser,function(req, res, next) {
  if (req.files.filetoupload.name) {
    // Create MyFile document
    var newMyFile = new MyFile({
      owner: req.session._id,
      filename: req.files.filetoupload.name,
      mimetype: req.files.filetoupload.type,
      size: req.files.filetoupload.size,
      privateFile: false
    });
    newMyFile.systemFilename = newMyFile.id + "-" + newMyFile.filename;

    // Save and move to new location
    newMyFile.save((err, MyFile) => {
      if (err) return next(createError(500, "Could not create new MyFile record in DB."));
      const newFile = path.join(__dirname, "../", req.app.conf.privateFiles, req.session._id, MyFile.systemFilename);
      mv(req.files.filetoupload.path, newFile, {mkdirp: true}, function (err) {
        // TODO - add some error management
        if (err) console.log(err);
      });
    });

    /*if (req.session.savingToFeed) {
      //add to album
    }*/

    // files moved and saved to db

    // Add post to user record TODO - make this a separate collection
    user.findOne({username:req.session.user}, (err, u) => {
      u.posts.push({
        _id:newMyFile.id,
        author:req.session.user,
        authorID: req.session._id,
        static_url: newMyFile.systemFilename,
        caption: req.body.caption,
        category: req.body.type,
        comments: [],
        likes: [],
        type: newMyFile.mimetype,
        created_at: new Date()
      });
      u.save(err => {
        if (err) throw err;
        // Redirect back after the job is done.
        res.redirect('/')
      });
    });
  } else {
    // Send error, no file uploaded
    next(createError(400, "File missing from upload."))
  }
});

module.exports = router;
