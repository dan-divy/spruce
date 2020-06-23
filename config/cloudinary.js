var cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: '<CLOUD_NAME>',
  api_key: '<API_KEY>',
  api_secret: '<API_SECRET>'
});

module.exports = cloudinary;
