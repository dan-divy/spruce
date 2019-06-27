var express = require('express');
var router = express.Router();
var httpRequest = require('request');

var db = require('../../utils/handlers/user');
var formParser = require('../../utils/form-parser.js');
var User = require('../../utils/models/user');

router.get('/', function(req, res, next) {
	res.render('dev/index', {
		title: req.app.conf.name,
		error:false
	});
})

router.get('/userInfo', function(req, res, next) {
    if(req.query.username) {
        User
        .findOne({username:req.query.username})
        .exec((err, userDetails) => {
            if(!userDetails) return res.status(404)
            var profile_picture = "https://spruce.divy.work"+userDetails.profile_picture
            var toBeSent = {
                username:userDetails.username,
                profile_picture:profile_picture,
                dob:userDetails.dob,
                bio:userDetails.bio,
                firstname:userDetails.firstname,
                lastname:userDetails.lastname
            }
            res.status(200).send(toBeSent);
        })
    }
});

module.exports = router;
