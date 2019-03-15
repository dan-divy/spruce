var express = require('express');
var router = express.Router();
var user = require('../utils/handlers/user');
var ta = require('time-ago')
/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session._id && req.session.user) {	
  	user.getAll((err, users) => {
  			
		  	res.render('index', {
		  		user:req.session.user,
		  		title: req.app.conf.name,
		  		people: users,
		  		posts:true
		  	});
		 });
		
		}
  else {
  	
  	 res.render('auth/login', { 
  		title: req.app.conf.name,
  		error:false
  	  })	
  	
  	
  }
});

module.exports = router;
