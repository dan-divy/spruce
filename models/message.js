'use strict';
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = Schema({
  user_id: { 
    type : Schema.Types.ObjectId,
    required: [true, 'User ID is required!'],
    ref: 'user' 
  },
  message_body: {
    type: String,
    required: [true, 'Message body is required!'],
    trim: true
  },
  sent_at: Date
});

module.exports = mongoose.model("message", messageSchema);