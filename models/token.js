'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
var tokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId, 
    ref: 'user',
    required: [true, 'User ID is required!']
  },
  username: {
    type: String,
    required: [true, 'Username is required!'],
    trim: true
  },
  refreshToken: {
    type: String,
    unique: true,
    required: [true, 'Refresh Token is required!'],
    trim: true
  },
  revoked: Boolean,
  revoked_on: Date,
  expires_on: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('token', tokenSchema);