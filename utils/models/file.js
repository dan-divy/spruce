'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = mongoose.Schema({
  owner: Schema.Types.ObjectId,
  filename: String,
  systemFilename: String,
  mimetype: String,
  size: Number,
  privateFile: Boolean,
  created_at : String,
  updated_at : String
});

fileSchema.pre('save', function(next) {
  var file = this;
  file.updated_at = new Date();
  next();
});

module.exports = mongoose.model('file', fileSchema);