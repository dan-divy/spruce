'use strict';
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

require('./user');
require('./chatroom');

const messageSchema = Schema({
  user: { 
    type : Schema.Types.ObjectId,
    required: [true, 'User ID is required!'],
    ref: 'user' 
  },
  chatroom: { 
    type : Schema.Types.ObjectId,
    required: [true, 'Chatroom is required!'],
    ref: 'chatroom' 
  },
  message_body: {
    type: String,
    required: [true, 'Message body is required!'],
    trim: true
  },
  sent_at: Date
});

module.exports = mongoose.model("message", messageSchema);