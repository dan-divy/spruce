'uses strict';
const auth = require('basic-auth');
const debug = require('debug')('spruce:controllerFile');
const fs = require('fs');
const formidable = require('formidable');
const path = require('path');


const pathToRoot = '../../';
// Models
const Collection = require(path.join(__dirname, pathToRoot, 'models/collection'));
const File = require(path.join(__dirname, pathToRoot, 'models/file'));

module.exports = (conf) => {

  const controller = {};

  controller.getFile = async (req, res) => {
    const fileId = req.params.fileId || req.query.fileId;
    if (!fileId) return res.status(400).json({ error: 'File Id not present. Cannot retrieve file.' });

    const file = await File.findById(fileId);
    if (!file) return res.status(500).json({ error: 'File not found in database. Cannot retrieve file.' });

    res.append('Content-Length', file.size);
    res.append('File-Name', file.name);
    res.append('Encrypted', file.encrypted || 'false');
    //res.append('Content-Disposition', `inline; filename=${file.name}`);
    res.contentType(file.type);
    fs.access(file.path, fs.constants.R_OK, err => {
      if (err) return res.status(500).json({ error: 'File not found. Cannot retrieve file.' });
      fs.createReadStream(file.path).pipe(res);
    });
  };

   // Upload to collection
  controller.uploadToCollection = async (req, res) => {
    const userId = req.locals.userId;
    const collectionId = req.params.collectionId || req.query.collectionId;

    if (!userId) return res.status(500).json({ error: 'User Id not parsed. Cannot upload file(s)' });
    if (!collectionId) return res.status(500).json({ error: 'Collection Id not present. Cannot upload file(s)' });

    const collection = await Collection.findById(collectionId).populate({ path: 'community', select: 'managers members'});

    if (!collection.community || !collection.community.managers || !collection.community.members) {
      return res.status(500).json({ error: 'Collection error, no community populated.' });
    }

    var isMember = false;
    collection.community.managers.forEach(manager => {
      if (manager == userId) isMember = isMember || true;
    });
    collection.community.members.forEach(member => {
      if (member == userId) isMember = isMember || true;
    });

    if (!isMember) return res.status(400).json({ error: 'User is not a member of the community.' });

    const uploadDir = path.join(__dirname, pathToRoot, 'dist/files/collections', collection.relativePath || collectionId);

    const dirOptions = {
      recursive: true,
    }
    fs.mkdir(uploadDir, dirOptions, err => {
      if (err) return res.status(500).json({ error: err });
      evaluateUploadToCollection(req, res, conf.name, collection, uploadDir);
    })
  };

  return controller;
};

const evaluateUploadToCollection = async (req, res, name, collection, uploadDir) => {
  const userId = req.locals.userId;
  const collectionId = req.params.collectionId || req.query.collectionId;

  if (!userId || !collectionId) return res.status(500).json({ error: 'User ID or collection ID not present.' });

  var form = new formidable.IncomingForm();

  form.uploadDir = uploadDir;
  form.keepExtensions = true;
  form.hash = 'sha1'; // 'sha1' || 'md5'
  form.multiples = true;

  form.parse(req, async (err, fields, files) => {
    const encrypted = fields.encrypt != 'false';
    var promiseArray = [];
    var uploads = [];

    if (Array.isArray(files[name])) {
      uploads = files[name];
    } else {
      uploads.push(files[name]);
    }

    if (encrypted) {
      //TODO
      return res.status(200).json({ error: "Encryption not yet implemented."});
    } 
    for (var i = 0; i < uploads.length; i++) {
      const promise = new Promise(async (resolve, reject) => {

        const upload = uploads[i];

        var query = {
          size: upload.size,
          name: upload.name,
          type: upload.type,
          hash: upload.hash,
          coll: collectionId
        }
        const fileExits = await File.findOne(query);
        if (fileExits) {
          resolve({ reject: `${upload.name} ` });
        } else {
          query.path = upload.path;
          query.lastModifiedDate = upload.lastModifiedDate;
          query.user = userId;
          query.privateFile = collection.community.private;

          const newFile = new File(query);
          newFile.save((err, file) => {
            if (err) {
              resolve({ errors: `Could not save new ${upload.name} to database.` });
              return;
            }
            resolve({ file: file });
          });
        }
      }); //promise
      promiseArray.push(promise);
    } // For Loop

    Promise.all(promiseArray).then((results) => {
      var response = {
        files: [],
        reject: '',
        error: ''
      };

      results.forEach(result => {
        if (result.file) {
          collection.files.push(result.file._id);
          response.files.push(result.file);
        }
        if (result.reject) response.reject += `${result.reject} `;
        if (result.error) response.error += `${result.error} `;
      });
      if (response.reject) response.reject = `The file(s) already exist in the colleciton: [ ${response.reject} ]`;
      if (response.error) response.error = `The following error(s) occured: [ ${response.error} ]`;

      collection.save((err, coll) => {
        if (err) {
          response.errors += (`Could not save new file(s) to collection.`);
        }
        if (response.error.length) {
          res.status(500).json(response);
        } else if (response.files.length) {
          res.status(200).json(response);
        } else {
          res.status(400).json(response);
        }
      });
    });
  }); // Form Parse

  form.on('progress', function(bytesReceived, bytesExpected) {
    
    debug(bytesReceived, bytesExpected)

  });

  form.on('end', function() {

    debug('end')

  });

  form.on('aborted', function() {
  
    debug('aborted')

  });
};