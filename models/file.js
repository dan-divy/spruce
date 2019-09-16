'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = Schema({
  user: {
    type: Schema.Types.ObjectId, 
    ref: 'user',
    required: [true, 'User ID is required!']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required!'],
    trim: true
  },
  systemFilename: {
    type: String,
    required: [true, 'Full path and filename is required!'],
    trim: true
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required!'],
    trim: true
  },
  size: Number,
  privateFile: { type: Boolean, default: false },
  created_at : { type: Date, default: Date.now },
  updated_at : { type: Date, default: Date.now }
});

fileSchema.pre('save', function(next) {
  var file = this;
  file.updated_at = new Date();
  next();
});

module.exports = mongoose.model('file', fileSchema);