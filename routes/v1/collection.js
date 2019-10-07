'uses strict';
const debug = require('debug')('spruce:routerCollection');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api} = conf;
  // Controllers
  const pathToControllers = path.join(__dirname, pathToRoot, 'controllers', api);
  const collectionController = require(path.join(pathToControllers, 'collection'))(conf);
  // Middleware
  const commMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/community`))(conf);
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  // Create a new collection
  router.post('/', jwtMW.verifyToken, commMW.userIsMember, collectionController.create);
  // Get a collection
  router.get('/', jwtMW.verifyToken, collectionController.get);


  return router;
}