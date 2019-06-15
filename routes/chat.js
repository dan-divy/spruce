var express = require('express');
var router = express.Router();
var db = require('../utils/handlers/user');
var formParser = require('../utils/form-parser');
var mongoose = require('mongoose');
var User = require('../utils/models/user');
var Room = require('../utils/models/room');



router.get('/', function(req, res, next) {
  User
  .find({})
  .exec((error, users) => {
    res.render('chat/index', {
      title: req.app.conf.name,
      users: users
    })
  })
});

router.get('/:userid', function(req, res, next) {
  require('../utils/handlers/socket');
  User
  .findOne({_id:req.params.userid})
  .exec((error, user) => {
    var possibleRoomId = user._id+req.session._id;
    req.session.socket = {};
    req.session.socket.room = possibleRoomId;
    Room
    .findOne({id:possibleRoomId})
    .exec((err, chatRoom) => {
      if(chatRoom) {
        res.render('chat/room', {
          title: req.app.conf.name,
          room: chatRoom,
          session:req.session
        })
      }
      else {
        var newChatRoom = new Room({
          id:possibleRoomId,
          users:[
            user._id,
            req.session._id
          ],
          chats:[]
        })
        newChatRoom.save((err, done) => {
          res.render('chat/room', {
            title: req.app.conf.name,
            room: done,
            session:req.session
          })
        })
      }
    })
  })
});




module.exports = router;
