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

router.get('/:user', function(req, res, next) {
  User
  .findOne({username:req.params.user})
  .exec((error, user) => {
    var possibleRoomId = user._id+req.session._id;
    console.log(possibleRoomId);
    Room
    .findOne({id:possibleRoomId})
    .exec((err, chatRoom) => {
      if(chatRoom) {
        res.render('chat/room', {
          title: req.app.conf.name,
          room: chatRoom
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
            room: done
          })
        })
      }
    })
  })
});




module.exports = router;
