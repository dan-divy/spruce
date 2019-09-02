'use strict';
const express = require('express');
const httpError = require('http-errors');
const path = require('path');

const router = express.Router();

const pathToRoot = '../../../';
const Community = require(path.join(__dirname, pathToRoot, 'utils/models/community'));

// Create a new community
router.post('/', function(req, res, next) {
  const communityName = req.body.communityName;
  const creatorId = req.session._id;
  const description = req.body.description;
  const privateComm = req.body.private || false;

  if (!communityName) return res.status(406).json({ message: "Request not acceptable. Community name is required."});
  if (!creatorId) return res.status(406).json({ message: "Request not acceptable. Session issue. Creator's memberID is required."});

  Community.findOne({ name : communityName }, (err, community) => {
    if (err) return res.status(500).json({ message: 'Server error. Could not search the communities.' });
    if (community) return res.status(409).json({ message: 'That community name already exists.' });

    const newCommunity = new Community({
      name: communityName,
      description: description,
      private: privateComm,
      created_at: new Date()
    });
    newCommunity.managers.push(creatorId);

    newCommunity.save(err => {
      if (err) return res.status(500).json({ message: 'Server error. Could not create new community.' });

      res.status(200).json({ message: `Community ${newCommunity.name} created.`});
    });
  });
});

module.exports = router;