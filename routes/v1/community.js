'uses strict';
const debug = require('debug')('spruce:routerCommunity');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api} = conf;
  // Controllers
  const pathToControllers = path.join(__dirname, pathToRoot, 'controllers', api);
  const communityController = require(path.join(pathToControllers, 'community'))(conf);
  // Middleware
  const commMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/community`))(conf);
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  // Create a new community
  router.post('/', jwtMW.verifyToken, communityController.create);
  // Check to see if a community name exists
  router.get('/name', jwtMW.verifyToken, communityController.checkCommunityName);
  // Get all the communities
  router.get('/all', jwtMW.verifyToken, communityController.getAll);
  // Get all the user's communities
  router.get('/user', jwtMW.verifyToken, communityController.getUser);
  // Get all the communities a user is not a member of
  router.get('/available', jwtMW.verifyToken, communityController.getAvailable);
  // Get a community object
  router.get('/:communityId', jwtMW.verifyToken, commMW.userIsMember, communityController.getCommunity);
  // Update/Save a community
  router.patch('/', jwtMW.verifyToken, commMW.userIsManager, communityController.update);
  // Delete a community
  router.delete('/:communityId', jwtMW.verifyToken, commMW.userIsManager, communityController.delete);


  return router;
}