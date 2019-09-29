'use strict';
const debug = require('debug')('spruce:jwtMW');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

const pathToRoot = '../../';

module.exports = (conf) => {
  const {name} = conf;
  if (!name) throw Error("MW jwt.js - App name required");
  const jwtParams = conf.jwt;
  if (!jwtParams) throw Error("MW jwt.js - JSON Web Token paramaters required");
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwtParams);

  const middleware = {};
  middleware.verifyToken = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const token = req.headers.authorization.split(' ')[1];
      const validToken = jwtUtils.verify(token);

      if (!token || !validToken || !validToken.userId) {
        return res.status(401).json({ message: 'Invalid Token' });
      }
      // Set the userId for the controller functions
      if (!req.locals) req.locals = {};
      req.locals.userId = validToken.userId;
      next();
    } else {
      res.status(400).json({ message: 'Token required' });
    }
  }

  middleware.verifyRefreshToken = (req, res, next) => {

    // TODO - add a check to ensure refresh token isn't revoked.


    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const token = req.headers.authorization.split(' ')[1];
      const validToken = jwtUtils.verify(token, 'refresh');

      if (!token || !validToken || !validToken.userId) {
        return res.status(401).json({ message: 'Invalid Token' });
      }
      // Set the userId for the controller functions
      if (!req.locals) req.locals = {};
      req.locals.userId = validToken.userId;
      next();
    } else {
      res.status(400).json({ message: 'Token required' });
    }
  }

  middleware.verifyResourceToken = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer' || req.query.token) {
      var token = req.headers.authorization.split(' ')[1] || req.query.token;

      const validToken = jwtUtils.verify(token, 'resource');
      if (!validToken) {
        return res.status(401).json({ message: 'Invalid Token' });
      }
      next();
    } else {
      res.status(400).json({ message: 'Token required' });
    }
  }
  
  return middleware;
};