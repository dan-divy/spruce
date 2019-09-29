'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

// define the schema for our user model
const userSchema = Schema({
  username: {
    type: String,
    required: [true, 'Username is required!'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required!']
  },
  firstname: {
    type: String,
    required: [true, 'First name is required!'],
    trim: true
  },
  lastname: {
    type: String,
    required: [true, 'Last name is required!'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required!'],
    trim: true
  },
  email_verified: { type: Boolean, default: false },
  temp_password  : String,
  temp_password_time: Date,
  reset: [{ 
    nonce: String,
    expires: { type: Date, default: Date.now },
    viewed: { type: Boolean, default: false },
  }],
  bio: String,
  admin: { type: Boolean, default: false },
  followers: [{ type : Schema.Types.ObjectId, ref: 'user' }],
  posts: [{ type : Schema.Types.ObjectId, ref: 'post' }],
  profile_pic: String, // /public/profile_pic/username/user.png
  facebook: String,
  google: String,
  instagram: String,
  tokens: [{
    accessToken: String,
    kind: String 
  }],
  lastLogin: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.pre('save', function(next) {
  var user = this;
  // Make sure there is at least one administrator
  user.constructor.countDocuments(function(err, count) {
    if (err) { return next(err); }
    if (!count) { user.admin = true; }
    user.updated_at = new Date();
    next();
  });
});

module.exports = mongoose.model('user', userSchema);