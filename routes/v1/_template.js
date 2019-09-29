'uses strict';
const debug = require('debug')('spruce:routerXYZ');
const express = require('express');
const path = require('path')
const router = express.Router();


module.exports = (api, mongo) => {
  const pathToControllers = path.join(__dirname, '../../controllers', api);

  const authController = require(path.join(pathToControllers, '/authentication'))(api);

  /* GET XXX listing. */
  router.get('/', authController.get);

  return router;
}