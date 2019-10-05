'uses strict';
const debug = require('debug')('spruce:routerAuthentication');
const express = require('express');
const path = require('path')
const router = express.Router();

const pathToRoot = '../../';

module.exports = (conf, passport) => {
  const {api, name, jwt} = conf;
  const pathToControllers = path.join(__dirname, pathToRoot, 'controllers', api);
  // Controllers
  const authController = require(path.join(pathToControllers, '/authentication'))(conf, passport);
  // Middleware
  const jwtMW = require(path.join(__dirname, pathToRoot, `middleware/${api}/jwt`))(conf);

  router.post('/', authController.login);
  router.get('/', jwtMW.verifyRefreshToken, authController.revoked);
  router.get('/access', jwtMW.verifyRefreshToken, authController.access);
  router.get('/logout', jwtMW.verifyToken, authController.logout);

  if (conf.sso.enabled) {
    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    router.get('/google', authController.ssoGoogleAuthenticate);
    router.get('/google/callback', authController.ssoGoogleCallback);
    // google ---------------------------------
    router.get('/connect/google', authController.ssoGoogleConnect);
    router.get('/connect/google/callback', authController.ssoGoogleConnectCallback);

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // locally --------------------------------
    router.post('/connect/local', authController.ssoConnectLocal);

    /*
      need to return to this
      http://www.passportjs.org/docs/authorize/
      http://www.passportjs.org/packages/passport-google-oauth20/
    */


  };

  return router;
}