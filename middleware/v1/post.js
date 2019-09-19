'use strict';
const debug = require('debug')('oak:postMW');
const path = require('path');

const pathToRoot = '../../';

module.exports = (conf) => {
  if (!conf) throw Error("App configuration required");
  const Post = require(path.join(__dirname, pathToRoot, 'models/post'));

  const middleware = {};
  middleware.userCreatedPost = async (req, res, next) => {
    const userId = req.locals.userId;
    const postId = req.body.postId || req.query.postId;

    if (!userId) return res.status(500).json({ message: `User ID not parsed.` });
    if (!postId) return res.status(400).json({ message: `Post ID not parsed.` });

    Post
    .findOne(
      // Query
      { $and: [ 
        { _id: postId }, 
        { user: userId }
      ] }
    )
    .then(post => {
      if (!post) return res.status(400).json({ message: `Post not found or user did not create the post.` });
      next();
    });
  };

  return middleware;
};
