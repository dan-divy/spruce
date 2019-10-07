'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('./collection');
require('./file');

const fileSchema = Schema({
  size: Number,
  path: {
    type: String,
    required: [true, 'Full path and filename is required!'],
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Filename is required!'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'MIME type is required!'],
    trim: true
  },
  hash: String,
  lastModifiedDate: String,
  user: {
    type: Schema.Types.ObjectId, 
    ref: 'user',
    required: [true, 'User ID is required!']
  },
  coll: {
    type: Schema.Types.ObjectId, 
    ref: 'collection',
    required: [true, 'Collection ID is required!']
  },
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