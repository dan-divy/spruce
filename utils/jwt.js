// for more info on claims https://tools.ietf.org/html/rfc7519#section-4.1
//https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e

'use strict';
const debug = require('debug')('spruce:jwtUtils');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');


module.exports =(name, jwtParams) => {
  if (!name) throw Error("jwt.js - App name required");
  if (!jwtParams) throw Error("jwt.js - JSON Web Token paramaters required");

  // use 'utf8' to get string instead of byte array  (512 bit key)
  const pathToRoot = '../';
  const privateKEY  = fs.readFileSync(path.join(__dirname, pathToRoot, jwtParams.key), 'utf8');
  const publicKEY  = fs.readFileSync(path.join(__dirname, pathToRoot, jwtParams.cert), 'utf8');
  const functions = {};

  functions.create = (payload, type = 'access') => {
    // Token signing options
    switch (type) {
      case 'refresh':
        var signOptions = {
          expiresIn: jwtParams.refresh.expiresIn,
          subject: jwtParams.refresh.subject
        };
        break;
      case 'resource':
        var signOptions = {
          expiresIn: jwtParams.resource.expiresIn,
          subject: jwtParams.resource.subject
        };      
        break;
      default:
        // assume access token
        var signOptions = {
          expiresIn: jwtParams.access.expiresIn,
          subject: jwtParams.access.subject
        };
        break;
    };
    signOptions.algorithm = jwtParams.alg;
    signOptions.audience = jwtParams.aud == '' ? name : jwtParams.aud;
    signOptions.issuer = jwtParams.iss == '' ? name : jwtParams.iss;

    if (payload) {
      return jwt.sign(payload, privateKEY, signOptions);
    } else {
      return null;
    }
  };

  functions.verify = (token, type = 'access') => {

    var verifyOptions = {
      algorithm: jwtParams.alg,
      issuer: jwtParams.iss == '' ? name : jwtParams.iss,
    };
    switch (type) {
      case 'refresh':
        verifyOptions.expiresIn = jwtParams.refresh.expiresIn;
        verifyOptions.subject = jwtParams.refresh.subject;
        break;
      case 'resource':
        verifyOptions.expiresIn = jwtParams.resource.expiresIn;
        verifyOptions.subject = jwtParams.resource.subject;
        break;
      default:
        // assume access token
        verifyOptions.expiresIn = jwtParams.access.expiresIn;
        verifyOptions.subject = jwtParams.access.subject;
        break;
    }
    try {
      return jwt.verify(token, publicKEY, verifyOptions);
    } catch (err) {
      return false;
    }
  };

  functions.decode = (token) => {
    return jwt.decode(token, {complete: true});
    //returns null if token is invalid
  };
/*
  functions.verifyToken = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const token = req.headers.authorization.split(' ')[1];
      const validToken = functions.verify(token);

      if (!token && !validToken && !validToken.userId) {
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

  functions.verifyRefreshToken = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const token = req.headers.authorization.split(' ')[1];
      const validToken = functions.verify(token, 'refresh');

      if (!token && !validToken && !validToken.userId) {
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

  functions.verifyResourceToken = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer' || req.query.token) {
      var token = req.headers.authorization.split(' ')[1] || req.query.token;

      const validToken = functions.verify(token, 'resource');
      if (!validToken) {
        return res.status(401).json({ message: 'Invalid Token' });
      }
      next();
    } else {
      res.status(400).json({ message: 'Token required' });
    }
  }*/
  return functions;
};