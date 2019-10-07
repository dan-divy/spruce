'uses strict';
const auth = require('basic-auth');
const debug = require('debug')('spruce:controllerCollection');
const path = require('path')

const pathToRoot = '../../';

module.exports = (conf) => {
  // Models
  const Chatroom = require(path.join(__dirname, pathToRoot, 'models/chatroom'));
  const Collection = require(path.join(__dirname, pathToRoot, 'models/collection'));
  const Community = require(path.join(__dirname, pathToRoot, 'models/community'));

  const controller = {};

   // Create a new Collection
  controller.create = (req, res) => {
    const userId = req.locals.userId;
    const communityId = req.body.communityId;
    const collectionName = req.body.name;

    if (!userId) return res.status(500).json({ error: 'User ID not present.' });
    if (!communityId) return res.status(500).json({ error: 'Community ID not present.' });
    if (!collectionName) return res.status(400).json({ error: 'Collection name required.' });

    const newCollection = Collection({
      name: collectionName,
      community: communityId,
      created_by: userId,
      updated_by: userId
    });

    newCollection.save((err, collection) => {
      if (err) return res.status(500).json({ error: 'Could not save new collection.' + err });

      Community
      .findById(communityId)
      .then(community => {
        community.collections.push(collection._id);
        community.save((err, community) => {
          if (err) return res.status(500).json({ error: 'Could not save new collection to community.' + err });

          res.status(200).json({ collection: collection });
        })
      })
    })
  };

  controller.get = (req, res) => {
    const userId = req.locals.userId;
    const collectionId = req.body.collectionId || req.params.collectionId || req.query.collectionId;

    if (!userId) return res.status(500).json({ error: 'User ID not present.' });
    if (!collectionId) return res.status(400).json({ error: 'Collection ID not present.' });

    // TODO - handle paging

    Collection
    .findById(collectionId)
    .populate({ path: 'community', select: '_id name' })
    .populate({ path: 'files', select: '_id name type' })
    .populate({ path: 'created_by', select: 'username' })
    .populate({ path: 'updated_by', select: 'username' })
    .then(collection => {
      if (!collection) return res.status(400).json({ error: 'Could not find collection' });
      res.status(200).json({ collection: collection });
    });
  };

  return controller;
};
