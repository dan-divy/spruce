'use strict';
const debug = require('debug')('spruce:commMW');
const path = require('path');

const pathToRoot = '../../';

module.exports = (conf) => {
  if (!conf) throw Error("App configuration required");

  const Collection = require(path.join(__dirname, pathToRoot, 'models/collection'));
  const Community = require(path.join(__dirname, pathToRoot, 'models/community'));

  const middleware = {};
  middleware.userIsManager = async (req, res, next) => {
    var communityName = req.query.communityName || req.body.communityName;
    const communityId = req.params.communityId || req.body.communityId || req.query.communityId;

    if (communityId) {
      const result = await Community.findById(communityId, { name: true });
      communityName = result.name;
    } else {
      communityName = req.query.communityName || req.body.communityName;
    }
    if (!communityName) {
      return res.status(400).json({ error: `Community name required.` });
    }

    if (!req.locals || !req.locals.userId) return res.status(500).json({ error: `User ID not parsed.` });

    Community
    .findOne(
      // Query
      { $and: [ 
        { name: { $regex: communityName, $options: 'i' } }, 
        { managers: req.locals.userId }
      ] }
    )
    .then(community => {
      if (!community) return res.status(400).json({ error: `Community name not found or user is not a manager.` });
      next();
    });
  };

  middleware.userIsMember = async (req, res, next) => {
    const userId = req.locals.userId;
    const communityId = req.body.communityId || req.params.communityId || req.query.communityId || req.locals.communityId;

    if (!userId) return res.status(500).json({ error: `User ID was not parsed.`});
    if (!communityId) return res.status(500).json({ error: `Community ID required.`});

    var isMember = false;

    Community
    .findById(communityId)
    .then(community => {
      if (!community) return res.status(500).json({ error: `Community not found.`});

      community.managers.forEach(manager =>{
        if (manager._id == userId) isMember = isMember || true;
      })
      community.members.forEach(member =>{
        if (member._id == userId) isMember = isMember || true;
      })
      if (isMember) return next();
      
      res.status(400).json({ error: `Community not found or user is not a member.` });
    });
  };

  middleware.populateLocalCommunityIdFromCollectionId = async (req, res, next) => {
    const collectionId = req.body.collectionId || req.params.collectionId || req.query.collectionId;
    if (!collectionId) return res.status(500).json({ error: `Collection ID not found.`});

    const result = await Collection.findById(collectionId).select('community');
    if (!result || !result.community) return res.status(500).json({ error: `Community ID not found for collection ${collectionId}.`});

    req.locals.communityId = result.community;
    next();
  };

  return middleware;
};