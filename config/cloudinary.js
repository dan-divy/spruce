var cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name || '<CLOUD_NAME>',
  api_key: process.env.cloudinary_api_key || '<API_KEY>',
  api_secret: process.env.coudinary_api_secret || '<API_SECRET>'
});

var isSetup = false; //change to true if using cloudinary

module.exports = {
    cloudinary,
    isSetup
};
