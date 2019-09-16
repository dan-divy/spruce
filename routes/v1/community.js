'uses strict';
const debug = require('debug')('oak:routerCommunity');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api, name, jwt} = conf;
  // Controllers
  const pathToControllers = path.join(__dirname, pathToRoot, 'controllers', api);
  const communityController = require(path.join(pathToControllers, 'community'))(conf);
  // Middleware
  const commMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/community`))(conf);
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  // Create a new community
  router.post('/', jwtMW.verifyToken, communityController.create);
  router.get('/', jwtMW.verifyToken, communityController.checkCommunityName);
  router.get('/all', jwtMW.verifyToken, communityController.getAll);
  router.get('/user', jwtMW.verifyToken, communityController.getUser);
  router.get('/available', jwtMW.verifyToken, communityController.getAvailable);
  router.patch('/', jwtMW.verifyToken, commMW.userIsManager, communityController.update);
  router.delete('/:communityId', jwtMW.verifyToken, commMW.userIsManager, communityController.delete);


  return router;
}