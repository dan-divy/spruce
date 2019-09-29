'uses strict';
const auth = require('basic-auth');
const debug = require('debug')('spruce:controllerCommunity');
const path = require('path')

const pathToRoot = '../../';

module.exports = (conf) => {
  // Models
  const Chatroom = require(path.join(__dirname, pathToRoot, 'models/chatroom'));
  const Community = require(path.join(__dirname, pathToRoot, 'models/community'));

  const controller = {};

   // Create a new community
  controller.create = (req, res) => {
    const userId = req.locals.userId;
    const communityName = req.body.name;
    const communityPrivate = req.body.private || false;

    if (!userId) return res.status(500).json({ error: 'User ID not present.' });
    if (!communityName) return res.status(400).json({ error: 'Community name required.' });

    Community
    .findOne({ name : communityName })
    .then(community => {
      // if the community exists, join as a member, not a manager
      if (community) {
        // Join the community
        community.members.push(userId);
        community.save((err, comm) => {
          if (err) return res.status(500).json({ error: `Coule not join community. err: ${err}` });
          return res.status(200).json({ _id: comm.id, name: comm.name });
        });
      } else {
        // Create the community and respective chatroom
        const newChatroom = new Chatroom();
        const newCommunity = new Community({
          name: communityName,
          chatroom: newChatroom._id,
          private: communityPrivate,
          updated_by: userId
        });
        newChatroom.community = newCommunity._id;
        newChatroom.save((err, chatroom) => {
          if (err) return res.status(500).json({ error: `Could not chatroom for new community. Err: ${err}` });

          newCommunity.managers.push(userId);
          newCommunity.save((err, community) => {
            if (err) return res.status(500).json({ error: `Could not create new community. Err: ${err}` });
            res.status(200).json({ communityId: community.id, communityName: community.name })
          });

        });
      }
    })
  };

  // Verify if a community name exist
  controller.checkCommunityName = (req, res) => {
    try {
      var name = decodeURIComponent(req.query.communityName);
    } catch (err) {
      debug(err)
      name = null;
    }
    if (!name) return res.status(406).json({ error: `Cannot process query.` });

    Community
    .findOne({ name : name })
    .then(community => {
      if (community) return res.status(409).json();
      res.status(200).json();
    });
  }

  // Get all communities
  controller.getAll = (req, res) => {
    Community
    .find(
      // Query
      {},
      // Select
      { name: true }
    )
    .then((err, communities) => {
      if (err) return res.status(500).json({ error: `Cannot process query.` });
      res.status(200).json({ communityList: communities });
    });
  }

  // Get user's communities
  controller.getUser = (req, res) => {
    const userId = req.locals.userId;
    if (!userId) return res.status(500).json({ error: 'User ID not present.' });
    Community
    .find(
      // Query
      { $or: [ 
        { managers: userId },
        { members: userId },
        { pending: userId }
        ]
      },
      // Select
      { name: true, pending: true }
    )
    .then((err, communities) => {
      if (err) return res.status(500).json({ error: `Cannot process query.` });
      res.status(200).json({ communityList: communities });
    });
  }

  // Get communities where users is not a member
  controller.getAvailable = (req, res) => {
    const userId = req.locals.userId;
    if (!userId) return res.status(500).json({ error: 'User ID not present.' });

    Community
    .find(
      // Query
      { $and: [ 
        { managers: { $ne: userId } },
        { members: { $ne: userId } },
        { pending: { $ne: userId } }
        ]
      },
      // Select
      { name: true }
    )
    .then(communities => {
      res.status(200).json(communities);
    });
  }
  
  // Update a community
  controller.update = (req, res) => {
    const communityId = req.body.communityId;
    const name = req.body.communityName;
    const desc = req.body.description;
    const private = req.body.private == null ? false : true;

    if (!communityId) return res.status(400).json({ error: `Community ID required.` });

    Community
    .findById(communityId)
    .then(community => {
      community.name = name || community.name;
      community.description = desc || community.description;
      community.private = private || community.private;

      community.save(err => {
        if (err) return res.status(500).json({ error: `Could not save updates to community ${community.name}.` });
        res.status(200).json();
      })
    });
  }

  // Delete a community
  controller.delete = (req, res) => {
    const communityId = req.params.communityId;

    if (!communityId) return res.status(400).json({ error: `Community ID required.` });

    Community
    .deleteOne({ _id: communityId}, err => {
      if (err) return res.status(500).json({ error: `Could not delete community ID: ${communityId}.` });

      Chatroom.deleteOne({ community: communityId }, (err) => {
        if (err) return res.status(500).json({ error: `Could not delete chatroom for community ID: ${communityId}.` });
        
        res.status(200).json();
      });
    });
  }
  return controller;
};
