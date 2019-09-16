'uses strict';
const debug = require('debug')('oak:controllerPost');
const path = require('path');

const pathToRoot = '../../';

module.exports = (conf) => {
  const {name, jwt} = conf;

  const Post = require(path.join(__dirname, pathToRoot, 'models/post'));
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);
  
  const controller = {};

  // Create a new post
  controller.CreatePost = (req, res) => {
    const userId = req.locals.userId;
    const message = req.body.message_body;
    const fileId = req.body.fileId;

    if (!userId) return res.status(500).json({ error: 'User ID not parsed.' });
    if (!message) return res.status(400).json({ error: 'Message body required.' });

    const newPost = Post({
      user: userId,
      message_body: message,
    });
    if (fileId) newPost.file = fileId;

    newPost.save(async (err, post) => {
      if (err) return res.status(500).json({ error: `Could not save post. Err: ${err}` });

      if (post.file) {
        res.status(200).json(await Post.findById(post.id)
          .populate({ path: 'user', select: '-_id username' })
          .populate({ path: 'file', select: '-_id systemFilename' })
          );
      } else {
        res.status(200).json(await Post.findById(post.id)
          .populate({ path: 'user', select: '-_id username' })
          );
      }
    });
  };

  // Get a set of posts
  controller.GetPosts = (req, res) => {
    var pointInTime;
    if (req.query && req.query.pointInTime){
      pointInTime = decodeURIComponent(req.query.pointInTime);
    } else {
      pointInTime = new Date();
    }
    const pageNumber = req.query.pageNumber || 1;
    const postsPerPage = req.query.postsPerPage || conf.postsPerPage || 25;
    Post
    .find(
      // Query
      { created_at: { $lte: pointInTime } }
    )
    .sort({created_at: 'desc'})
    .limit(pageNumber * postsPerPage)   // try reordering these
    .skip((pageNumber - 1) * postsPerPage)
    .populate({ path: 'user', select: '-_id username' })
    .populate({ path: 'file', select: '-_id systemFilename' })
    .then(posts => {
      res.status(200).json(posts);
    });

  };

  return controller;
};