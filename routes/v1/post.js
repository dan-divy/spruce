'uses strict';
const debug = require('debug')('oak:routerPost');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api} = conf

  // Controllers
  const pathToControllers = path.join(__dirname, '../../controllers', api);
  const PostController = require(path.join(pathToControllers, '/post'))(conf);
  // Middleware
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  // Create a new post
  router.post('/', jwtMW.verifyToken, PostController.CreatePost);
  // Get a set of posts
  router.get('/', jwtMW.verifyToken, PostController.GetPosts);

  return router;
}