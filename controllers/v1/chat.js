'uses strict';
const debug = require('debug')('spruce:controllerChat');
const path = require('path');

const pathToRoot = '../../';

module.exports = (conf) => {
  const {name, jwt} = conf;
  // Models
  const Chatroom = require(path.join(__dirname, pathToRoot, 'models/chatroom'));
  const Community = require(path.join(__dirname, pathToRoot, 'models/community'));
  // Utils  
  const jwtUtils = require(path.join(__dirname, pathToRoot, 'utils/jwt'))(name, jwt);
  
  const controller = {};

  // Create a new community chatroom
  controller.CreateCommunityChatroom = async (req, res) => {
    const userId = req.locals.userId;
    const communityId = req.body.communityId || req.query.communityId;

    if (!userId) return res.status(500).json({ error: 'User ID not parsed.' });
    if (!communityId) return res.status(400).json({ error: 'Community ID required.' });

    const communityExist = await Community.findById(communityId);
    if (!communityExist || communityExist.chatroom) {
      return res.status(400).json({ error: 'Invalid Community or chatroom already exists.' });
    }

    const newChatRoom = Chatroom({
      community: communityId
    });

    communityExist.chatroom = newChatRoom._id;
    communityExist.updated_by = userId;
    
    communityExist.save((err, community) => {
      if (err) return res.status(500).json({ error: 'Error saving community chatroom. ', err });

      debug(err)
      debug(community)
      
      newChatRoom.manager.push(userId);
      newChatRoom.save(async (err, chatroom) => {
        if (err) return res.status(500).json({ error: 'Error creating chatroom. ', err });

        res.status(200).json({ chatroom : await Chatroom.findById(chatroom._id)
          .populate({ path: 'community', select: 'name' })
          .populate({ path: 'manager', select: 'username' })
        });
      });
    });
  };

  // Retreive a list communities with chatroom
  controller.GetCommunityChatrooms = async (req, res) => {
    const userId = req.locals.userId;

    if (!userId) return res.status(500).json({ error: 'User ID not parsed.' });

    const communities = await Community.find(
      // Query
      { $or: [
        { managers: userId },
        { members: userId }
      ]}
    )
    .select('name chatroom');
    
    res.status(200).json({ chatrooms: communities });
  };

  // Get a community name from the chatroomId
  controller.getCommunityName = (req, res) => {
    const chatroomId = req.params.chatroomId;
    if (!chatroomId) return res.status(406).json({ error: `Missing chatroom ID. Cannot process query.` });

    Chatroom
    .findById(chatroomId)
    .populate('community')
    .then(chatroom => {
      if (!chatroom) return res.status(400).json({ error: 'Community not found' });
      
      res.status(200).json({ name: chatroom.community.name});
    });
  }

  // Create a new user chatroom
  controller.CreateUserChatroom = async (req, res) => {
    const userId = req.locals.userId;
    const otherUserIds = req.body.otherUserIds;

    if (!userId) return res.status(500).json({ error: 'User ID not parsed.' });
    if (!otherUserIds) return res.status(400).json({ error: 'Additional user Ids required.' });

    otherUserIds.push(userId);

    const newChatRoom = Chatroom();
    otherUserIds.forEach(id => {
      newChatRoom.member.push(id);
    });

    newChatRoom.save(async (err, chatroom) => {
      if (err) return res.status(500).json({ error: 'Error creating chatroom. ', err });

      res.status(200).json({ chatroom: await Chatroom.findById(chatroom._id)
              .populate({ path: 'member', select: 'username' })
            });
    });
  };

  return controller;
};