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
  if(req.session._id == req.params.userid) return res.render("error",{
    message:"Can't chat with yourself...",
    error:{
      status:400,
      stack:"Can't chat with yourself."
    }
  });
  require('../utils/handlers/socket');
  User
  .findOne({_id:req.params.userid})
  .exec((error, user) => {
    if(!user) return res.status(404).send('No user found!');
    req.session.socket = {};
    Room
    .find({})
    .exec((err, chatRooms) => {
      var chatRoom = chatRooms
                     .find(r => 
                            (r.users[0] && r.users[1]) && (
                            (r.users[0].toString() == user._id.toString() && 
                            r.users[1].toString() == req.session._id) || 
                            (r.users[1].toString() == user._id.toString() && 
                            r.users[0].toString() == req.session._id)
                            )
                          )
      if(chatRoom) {
        req.session.socket.room = chatRoom._id;
        res.render('chat/room', {
          title: req.app.conf.name,
          room: chatRoom,
          session:req.session,
          reciever:user
        })
      }
      else {
        var possibleRoomId = user._id + req.session._id;
        req.session.socket.room = possibleRoomId;
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
            session:req.session,
            reciever:user
          })
        })
      }
    })
  })
});




module.exports = router;
