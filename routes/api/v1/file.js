'use strict';
const createError = require('http-errors');
const express = require('express');
const fs = require("file-system");
const path = require('path');
const router = express.Router();

const MyFile = require(path.join(__dirname, '../../../', 'utils/models/file'));

/* GET File thumbnail by static_url. */
router.get('/:static_url', function(req, res, next) {
  MyFile.findOne({ systemFilename: req.params.static_url }, (err, myFile) => {
    if (err || !myFile) return next(createError(404, err));

    //TODO - Improve this to serve thumbnails instead, also remove EXIF info; increase speed and data savings

    const fullFileName = path.join(__dirname, "../../../", req.app.conf.privateFiles, myFile.owner.toString(), myFile.systemFilename);
    fs.exists(fullFileName, (exists) => {
      if (exists) {
        // Content-type is very interesting part that guarantee that
        // Web browser will handle response in an appropriate manner.
        res.writeHead(200, {
          "Content-Type": myFile.mimetype,
          "Content-Disposition": "attachment; filename=" + myFile.filename
        });
        fs.createReadStream(fullFileName).pipe(res);
      } else {
        res.writeHead(400, {"Content-Type": "text/plain"});
        res.end("ERROR File does not exist");
      }
    });
  });
});

/* GET File full file by static_url. TODO - add permission check */
router.get('/complete/:static_url', function(req, res, next) {
  MyFile.findOne({ systemFilename: req.params.static_url }, (err, myFile) => {
    if (err || !myFile) return next(createError(404, err));

    const fullFileName = path.join(__dirname, "../../../", req.app.conf.privateFiles, myFile.owner.toString(), myFile.systemFilename);
    
    fs.readFile(fullFileName, (err, data) => {
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', myFile.mimetype || 'text/plain' );
        res.setHeader('Content-Disposition', 'inline; filename=' + myFile.filename);
        res.end(data);
      }
    });
  });
});

module.exports = router;
