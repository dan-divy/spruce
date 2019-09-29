'uses strict';
const debug = require('debug')('spruce:routerChat');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api} = conf

  // Controllers
  const ChatController = require(path.join(__dirname, pathToRoot, '/controllers', api, '/chat'))(conf);
  // Middleware
  const commMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/community`))(conf);
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  // Create a new community chatroom
  //router.post('/community/create', jwtMW.verifyToken, commMW.userIsManager, ChatController.CreateCommunityChatroom);
  // Get a list of the community chat rooms
  router.get('/community', jwtMW.verifyToken, ChatController.GetCommunityChatrooms);
  // Get a community's name by chatroomId
  router.get('/community/name/:chatroomId', jwtMW.verifyToken, ChatController.getCommunityName);
  // Create a new user chatroom
  router.post('/user/create', jwtMW.verifyToken, ChatController.CreateUserChatroom);

  return router;
};