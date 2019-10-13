'uses strict';
const debug = require('debug')('spruce:controllerAuthentication');
const path = require('path')

const pathToRoot = '../../';

module.exports = (conf, passport) => {
  const {name, jwt, verifyEmail} = conf;
  if (!name) throw Error('App name required.');
  if (!jwt) throw Error('JSON Web Token paramaters required.');
  if (typeof(verifyEmail) == null) throw Error('Verify email paramater required.');

  const Community = require(path.join(__dirname, pathToRoot, 'models/community'));
  const Token = require(path.join(__dirname, pathToRoot, 'models/token'));
  const User = require(path.join(__dirname, pathToRoot, 'models/user'));
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);

  const controller = {};

   // Login
  controller.login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Credentials required.' });
    }

    User
    .findOne({ email: email })
    .then(user => {
      if (!user) return res.status(400).json({ error: 'User not found.' });
      if (verifyEmail && !user.email_verified) return res.status(401).json({ error: 'Email not verified' });

      const validPassword = user.validPassword(password);
      if (!validPassword) return res.status(401).json({ error: 'Incorrect credentials.' });

      user.lastLogin = Date();
      user.save();

      // TODO - Social media sign on.
      if (conf.sso.enabled) {
        req.login(user, (err) => {
          debug('logged in user')
        })
      }
      
      // return refresh token
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
  };

  // Get access token
  controller.access = (req, res) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const token = req.headers.authorization.split(' ')[1];
      const tokenObj = jwtUtils.decode(token);

      if (!tokenObj.payload && !tokenObj.payload.sessionId) {
        return res.status(406).json({ error: 'Incorrect token payload' });
      }

      Token
      .findById(tokenObj.payload.sessionId)
      .then(async refreshToken => {
        if (!refreshToken) {
          return res.status(500).json({ error: 'Refresh token not found' });
        }

        if (refreshToken.revoked) return res.status(401).json({ error: 'Refresh token not authorized' });

        // Collect the latest user details
        const user = await User.findById(refreshToken.userId);
        if (!user) return res.status(500).json({ error: 'Server error. User not found.' });
        const usersCommunities = await Community.find(
          { $or: [ 
            { managers: refreshToken.userId }, 
            { members: refreshToken.userId },
            { pending: refreshToken.userId } 
          ] },
          // Select fields
          { name: true }
        );

        const payload = {
          sessionId: refreshToken.id,
          userId: user.id,
          username: user.username,
          community: usersCommunities,
          admin: user.admin
        };

        const token = jwtUtils.create(payload);

        res.status(200).json({ token: token });
      });
    } else {
      debug({ error: 'Token required' })
      res.status(400).json({ error: 'Token required' });
    }
  };

  // Logout
  controller.logout = (req, res) => {

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const token = req.headers.authorization.split(' ')[1];
      
      const tokenObj = jwtUtils.decode(token);

      if (!tokenObj.payload && !tokenObj.payload.sessionId) {
        return res.status(406).json({ error: 'Incorrect token payload' });
      }

      Token
      .findById(tokenObj.payload.sessionId)
      .then(foundToken => {
        if (!foundToken) {
          return res.status(500).json({ error: 'Refresh token not found' });
        }

        foundToken.revoked = true;
        foundToken.revoked_on = new Date();
        foundToken.save(err => {
          if (err) {
            return res.status(500).json({ error: `Token could not be revoked. Err: ${err}` });
          }
          res.status(200).json({ message: 'Logged out' });
        })
      });
    } else {
      res.status(400).json({ error: 'Bearer token not present.' });
    }
  };

  // Revoked token
  controller.revoked = (req, res) => {

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const token = req.headers.authorization.split(' ')[1];
      
      if (!token) return res.status(200).json({ error: 'Refresh token not present.' });

      Token
      .findOne({ refreshToken: token })
      .then(foundToken => {
        if (!foundToken) {
          return res.status(500).json({ error: 'Refresh token not found' });
        }
       
        res.status(200).json({ revoked: foundToken.revoked });
      });
    } else {
      res.status(400).json({ error: 'Bearer token not present.' });
    }
  };


  ////////// complete at
  // https://scotch.io/tutorials/easy-node-authentication-linking-all-accounts-together
  ////////////////////////////////////////////////////

  // Social Media Login
  // =============================================================================
  // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
  // =============================================================================

  // locally --------------------------------
  controller.ssoConnectLocal = (req, res) => {
    passport.authenticate('local-signup', {
      successRedirect : '/#profile', // redirect to the secure profile section
      failureRedirect : '/connect/local' // redirect back to the signup page if there is an error
    })
  };

  // =====================================
  // GOOGLE ROUTES =======================
  // =====================================
  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  controller.ssoGoogleAuthenticate = (req, res) => {
    passport.authenticate('google', { scope : ['profile', 'email'] });
  };

  controller.ssoGoogleCallback = (req, res) => {
    passport.authenticate('google', {
      successRedirect : '/#main',
      failureRedirect : '/#login'
    });
  };

  controller.ssoGoogleConnect = (req, res) => {
    passport.authorize('google', { scope : ['profile', 'email'] });
  };

  controller.ssoGoogleConnectCallback = (req, res) => {
    passport.authorize('google', {
      successRedirect : '/#profile',
      failureRedirect : '/'
    });
  };

  return controller;
};
