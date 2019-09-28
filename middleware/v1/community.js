'use strict';
const debug = require('debug')('spruce:commMW');
const path = require('path');

const pathToRoot = '../../';

module.exports = (conf) => {
  if (!conf) throw Error("App configuration required");
  const Community = require(path.join(__dirname, pathToRoot, 'models/community'));

  const middleware = {};
  middleware.userIsManager = async (req, res, next) => {
    var communityName = req.query.communityName || req.body.communityName;
    const communityId = req.params.communityId

    if (communityId) {
      const result = await Community.findById(communityId, { name: true });
      communityName = result.name;
    } else {
      communityName = req.query.communityName || req.body.communityName;
    }
    if (!communityName) {
      return res.status(400).json({ message: `Community name required.` });
    }

    if (!req.locals || !req.locals.userId) return res.status(500).json({ message: `User ID not parsed.` });

    Community
    .findOne(
      // Query
      { $and: [ 
        { name: { $regex: communityName, $options: 'i' } }, 
        { managers: req.locals.userId }
      ] }
    )
    .then(community => {
      if (!community) return res.status(400).json({ message: `Community name not found or user is not a manager.` });
      next();
    });
  };

  return middleware;
};