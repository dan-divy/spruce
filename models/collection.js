'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('./file');
require('./user');

const collectionSchema = Schema({
  name: {
    type: String,
    required: [true, 'Collection name is required!'],
    trim: true
  },
  files: [{ type : Schema.Types.ObjectId, ref: 'file' }],
  created_by : { 
    type : Schema.Types.ObjectId,
    required: [true, 'Collection creator user ID is required!'],
    ref: 'user' 
  },
  updated_by : { type : Schema.Types.ObjectId, ref: 'user' },
  created_at : { type: Date, default: Date.now },
  updated_at : { type: Date, default: Date.now }
});

collectionSchema.pre('save', function(next) {
  var collection = this;
  collection.updated_at = new Date();
  next();
});

module.exports = mongoose.model('collection', collectionSchema);