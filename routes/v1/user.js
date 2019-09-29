'uses strict';
const debug = require('debug')('spruce:routerAuthentication');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf) => {
  const {api} = conf

  // Controllers
  const pathToControllers = path.join(__dirname, '../../controllers', api);
  const userController = require(path.join(pathToControllers, '/user'))(conf);
  // Middleware
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  // Register new user
  router.post('/', userController.register);
  // Check to see if username exists
  router.get('/', userController.checkUsername);
  // Retrieve a user's profile
  router.get('/profile', jwtMW.verifyToken, userController.getProfile);
  // Reset user's password
  router.post('/reset', userController.reset);
  // Get user's email to enable reset password view
  router.get('/reset', userController.get_reset);
  // Complete password reset process
  router.post('/reset/complete', userController.resetComplete);

  return router;
}