// app/models/user.js
'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');
// define the schema for our user model
const userSchema = mongoose.Schema({
  username: String, // _username_
  password: String, // 123rikwdjbfp2ioeurroasodfj[OJ[Ojsjdfag*wef
  firstname: String, // firstName
  lastname: String, // lastName
  bio: String, // A new bio
  dob: String, // 23rd july 2018
  followers: Array, // ["134wr3","1q2easd2"]
  posts: Array,
  profile_pic: String, // /public/profile_pic/username/user.png
  chat_rooms: Array, // ["1234", "3456"]
  lastLogin: String, // 10 min ago
  notifications: Array, // [{msg:"New message from @user", link:"/chat/user"}]
  developer: Boolean, // true or false
  created_at: String,
  updated_at: String
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

userSchema.pre('save', function(next) {
  var user = this;
  user.updated_at = new Date();
  next();
});

module.exports = mongoose.model('user', userSchema);

// create the model for users and expose it to our app
