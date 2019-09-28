'uses strict';
const debug = require('debug')('spruce:routerPost');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api} = conf

  // Controllers
  const pathToControllers = path.join(__dirname, pathToRoot, 'controllers', api);
  const PostController = require(path.join(pathToControllers, '/post'))(conf);
  // Middleware
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);
  const postMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/post`))(conf);

  // Create a new post
  router.post('/', jwtMW.verifyToken, PostController.CreatePost);
  // Get a single post
  router.get('/', jwtMW.verifyToken, PostController.GetPost);
  // Delete post
  router.delete('/', jwtMW.verifyToken, postMW.userCreatedPost, PostController.DeletePost);
  // Get a set of posts
  router.get('/set', jwtMW.verifyToken, PostController.GetPosts);
  // Update post
  router.post('/update', jwtMW.verifyToken, postMW.userCreatedPost, PostController.UpdatePost);

  return router;
};