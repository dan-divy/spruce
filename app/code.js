const cmd=require('./cmd');
const express = require('express');
const router = express.Router();
const path = require('path');

var languages = {
	"node":"node",
	"go":"go run",
	"python":"python",
	"cpp":"g++",
	"php":"php"
	}


router.get('/', (req, res) => {
	res.render('code', {
		layout:false

	})
})

router.get('/:lang', (req, res) => {
	var queryLang = req.params.lang;
	res.render('editor', {
		layout:false,
		command:languages.queryLang,
		language:queryLang
	})
})

module.exports = router;