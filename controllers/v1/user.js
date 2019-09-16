'uses strict';
const debug = require('debug')('oak:controllerAuthentication');
const path = require('path');

const pathToRoot = '../../';

module.exports = (conf) => {
  const {name, jwt} = conf;

  const User = require(path.join(__dirname, pathToRoot, 'models/user'));
  const Token = require(path.join(__dirname, pathToRoot, 'models/token'));
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);
  
  const controller = {};

  // Register
  controller.register = (req, res) => {
    var username = req.body.username;
    const password = req.body.password;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;

    if (!username) username = firstname + lastname.charAt(0);

    var errors = '';
    if (!password) errors += "password ";
    if (!firstname) errors += "first name ";
    if (!lastname) errors += "last name ";
    if (!email) errors += "email";
    if ( !(password && firstname && lastname && email) ) {
      return res.status(400).json({ error: `Missing: ${errors}.` });
    };

    User
    .findOne({ email: email })
    .then(foundUser => {
      if (foundUser) return res.status(409).json({ error: `Email ${foundUser.email} is already registered.` });

      const newUser = new User({
        username: username,
        firstname: firstname,
        lastname: lastname,
        email: email
      });
      newUser.password = newUser.generateHash(password);

      newUser.save((err, user) => {
        if (err) return res.status(500).json({ error: `New user could not be saved. err: ${err}` });

        const newToken = new Token({
          userId: user.id,
          username: user.username
        });

        const exp = new Date();
        // Date in seconds from epoch
        exp.setSeconds(exp.getSeconds() + jwt.refresh.expiresIn)
        const payload = {
          userId: user.id,
          sessionId: newToken.id
        };
        const refreshToken = jwtUtils.create(payload, 'refresh');

        newToken.expires_on = exp;
        newToken.refreshToken = refreshToken;
        newToken.save((err, token) => {
          if (err) return res.status(500).json({ error: `Refresh token could not be saved. err: ${err}` });
          res.status(200).json({ token: token.refreshToken });
        });
      });
    });
  };

  // Reset
  controller.checkUsername = (req, res) => {
    try {
      var username = decodeURIComponent(req.query.username);
    } catch (err) {
      debug(err)
      username = null;
    }
    if (!username) return res.status(406).json({ error: `Cannot process query.` });

    User
    .findOne({ username : username })
    .then(user => {
      if (user) return res.status(409).json();
      res.status(200).json();
    });
  };

  // Get a user's profile
  controller.getProfile = (req, res) => {
    const userId = req.locals.userId;
    if (!userId) return res.status(500).json({ error: `Could not parse userId.` });

    User
    .findById(userId,
      // Select
      {
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        bio: true,
        followers: true,
        lastLogin: true
      }
    )
    .then(user => {
      if (!user) return res.status(500).json({ error: `Could not find user.` });
      res.status(200).json(user);
    });
  };

  // Reset
  controller.reset = (req, res) => {

    debug(req.body)

    return res.status(501).json({ error: 'NOT IMPLEMENTED: login ' });
    /*
      const crypto = require('crypto');
      var nonce = crypto.randomBytes(16).toString('base64');
    */
  };

  // Reset - get email and resend nonce to enable reset password view
  controller.get_reset = (req, res) => {

    debug(req.body)

    return res.status(501).json({ error: 'NOT IMPLEMENTED: login ' });

  };

  // Reset - complete
  controller.resetComplete = (req, res) => {

    debug(req.body)

    return res.status(501).json({ error: 'NOT IMPLEMENTED: login ' });
  };

  return controller;
};