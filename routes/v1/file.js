'uses strict';
const debug = require('debug')('spruce:routerFile');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api} = conf;
  // Controllers
  const pathToControllers = path.join(__dirname, pathToRoot, 'controllers', api);
  const fileController = require(path.join(pathToControllers, 'file'))(conf);
  // Middleware
  const commMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/community`))(conf);
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  // Get a file from a collection
  router.get('/:collectionId/:fileId',
    // Middleware callse
    jwtMW.verifyToken, 
    commMW.populateLocalCommunityIdFromCollectionId, 
    commMW.userIsMember,
    // Controller
    fileController.getFile);
    
  // Upload files to a collection
  router.post('/collection/:collectionId', 
    // Middleware callse
    jwtMW.verifyToken, 
    commMW.populateLocalCommunityIdFromCollectionId, 
    commMW.userIsMember,
    // Controller
    fileController.uploadToCollection);


  return router;
}