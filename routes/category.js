'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../utils/handlers/user');
const textParser = require('../utils/text-parser')
const formParser = require('../utils/form-parser');


router.get('/:category', function(req, res, next) {

	console.log(req.params.category);

	
  db.getAll((err, users) => {
  	res.render('category', {
  		title: req.app.conf.name,
  		people: users,
  		category:req.params.category
  	});
  });  
});

module.exports = router;