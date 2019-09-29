'uses strict';
const debug = require('debug')('spruce:controllerAuthentication');

module.exports = (mongo) => {
  const controller = {};
  // do stuff with conf

  // POST (create a resource or generally provide data)
  controller.post = (req, res) => {
    return res.status(501).json({ error: 'NOT IMPLEMENTED: post ' });
  };

  // GET (retrieve an index of resources or an individual resource)
  controller.get = (req, res) => {
    return res.status(501).json({ error: 'NOT IMPLEMENTED: get ' });
  };

  // PUT (create or replace a resource)
  controller.put = (req, res) => {
    return res.status(501).json({ error: 'NOT IMPLEMENTED: put ' });
  };

  // PATCH (update/modify a resource)
  controller.patch = (req, res) => {
    return res.status(501).json({ error: 'NOT IMPLEMENTED: patch ' });
  };

  // DELETE (remove a resource)
  controller.delete = (req, res) => {
     return res.status(501).json({ error: 'NOT IMPLEMENTED: delete ' });
  };

  return controller;
};
