var express = require('express');
var router = express.Router();
var httpRequest = require('request');
var apiKeyGen = require("apikeygen").apikey;

var db = require('../../utils/handlers/user');
var formParser = require('../../utils/form-parser.js');
var User = require('../../utils/models/user');
var Keys = require('../../utils/models/keys');

var secure_dev_key;
genAPIKey(function(key) {
    console.log("Developer key: " + key.apiKey + '\nVerify your account in /me with this key');
    // /me will have an input to hit this api with a key and make them developer
    // /developer/verify/keynehsnevsjebsueke
    secure_dev_key = key.apiKey;
})

router.get('/verify/:key', function(req, res, next) {
    if(req.params.key == secure_dev_key) {
        User
        .findOne({_id:req.session._id})
        .exec((err, userSchema) => {
            userSchema.developer = true;
            userSchema.save((err, result) => {
                res.redirect('/developer');
                Keys
                .findOne({apiKey: req.params.key})
                .exec((err, success) => {
                    if(success) return res.send({error:"Invalid API KEY"});
                    var newKeySchema = new Keys({
                        apiKey:req.params.key,
                        invokes:0,
                        stats:[]
                    })
                    newKeySchema.save((err, keySaveResult) => {
                        res.redirect('/developer');
                    });
                })
            });
        })
    } else {
        res.status(405).send('Incorrect key! Check the console on startup!'); 
     }
    });

router.use(function(req, res, next) {
    console.log(req.url);
    if(req.url == '/') return next();
    if(!req.query.apiKey) return res.status(405).send({error:"API KEY not provided."});
    Keys
    .findOne({apiKey:req.query.apiKey})
    .exec((err, key) => {
        if(!key) return res.status(405).send({error:"Invalid API KEY provided."});
        key.invokes++;
        key.stats.push({
            time:new Date(),
            request:req
        });
        key.save((err, done) => {
            if(err) return res.status(500).send({text:"Internal error.", err});
            req.apiKey = key;
            next();
        })
    })
});
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
            res.status(200).send(JSON.stringify(toBeSent, null, 2));
        })
    }
});

router.post('/generate', function(req, res, next) {
    genAPIKey((status) => {
        if(!status) return res.send({error:"Some internal error. Please try again."});
        res.send({apikey:status.apiKey});
    })
});


function genAPIKey(cb) {
    var key = apiKeyGen();
    console.log(key);
    Keys.findOne({apiKey:key}).exec((err, dbKey) => {
        if(dbKey) return cb(false);
        var newKey = new Keys({
            apiKey:key,
            stats:[],
            invokes:0
        });
        newKey.save((err, done) => {
            cb(done);
        })
    })
}
module.exports = router;
