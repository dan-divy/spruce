'use strict';
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

require('./user');
require('./file');

const postSchema = Schema({
  user: {
    type: Schema.Types.ObjectId, 
    ref: 'user',
    required: [true, 'User ID is required!']
  },
  message_body: {
    type: String,
    required: [true, 'Post body is required!'],
    trim: true
  },
  file: { 
    type : Schema.Types.ObjectId, 
    ref: 'file',
    trim: true
  },
  parent: { type : Schema.Types.ObjectId, ref: 'post' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("post", postSchema);