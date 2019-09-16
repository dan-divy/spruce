'use strict';
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../models/user');

// https://scotch.io/tutorials/easy-node-authentication-google
// https://scotch.io/tutorials/easy-node-authentication-linking-all-accounts-together

module.exports = (passport, sso) => {
  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // GOOGLE ==================================================================
  // =========================================================================
  passport.use(new GoogleStrategy({
    clientID : sso.google.clientID,
    clientSecret : sso.google.clientSecret,
    callbackURL : sso.google.callbackURL,
  },
  function(token, refreshToken, profile, done) {
    // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Google
    process.nextTick(function() {
      // try to find the user based on their google id
      User.findOne({ 'google' : profile.id }, function(err, user) {
        if (err)
          return done(err);
        if (user) {
          // if a user is found, log them in
          return done(null, user);
        } else {
          // if the user isnt in our database, create a new user
          var newUser = new User();
          // set all of the relevant information
          newUser.google = profile.id;
          newUser.token.push(token, 'google');
          newUser.username = profile.displayName;
          newUser.email = profile.emails[0].value; // pull the first email
          // save the user
          newUser.save(function(err) {
            if (err)
              throw err;
            return done(null, newUser);
          });
        }
      });
    });
  }));
};