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

  const TOKEN_ACCESS = 'access';
  const TOKEN_REFRESH = 'refresh';
  const TOKEN_RESOURCE = 'resource';
  functions.TOKEN_ACCESS = TOKEN_ACCESS;
  functions.TOKEN_REFRESH = TOKEN_REFRESH;
  functions.TOKEN_RESOURCE = TOKEN_RESOURCE;

  functions.create = (payload, type = TOKEN_ACCESS) => {
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

  functions.verify = (token, type = TOKEN_ACCESS) => {

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

  return functions;
};