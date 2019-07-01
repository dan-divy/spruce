// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
// define the schema for our user model
var userSchema = mongoose.Schema({
    username:String, // _username_
    password: String, // 123rikwdjbfp2ioeurroasodfj[OJ[Ojsjdfag*wef
    firstname: String, // firstName
    lastname: String, // lastName
    bio: String, // A new bio
    dob: String, // 23rd july 2018
    followers: Array, // ["134wr3","1q2easd2"]
    posts:Array, 
    profile_pic:String, // /public/profile_pic/username/user.png
    chat_rooms:Array, // ["1234", "3456"]
    lastLogin:String, // 10 min ago
    notifications:Array, // [{msg:"New message from @user", link:"/chat/user"}]
    developer:Boolean // true or false
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('user', userSchema);

// create the model for users and expose it to our app
