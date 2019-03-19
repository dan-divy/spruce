var formidable = require('formidable');

module.exports = function (req, res, next) {
	var form = formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		req.body = fields;
		req.files = files;
		next();
	})
}