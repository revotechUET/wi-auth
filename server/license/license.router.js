const express = require('express');
const router = express.Router();
const Model = require('./license.model');


router.post('/user/license', (req, res) => {
	Model.getUserLicense(req.body, (status) => {
		res.send(status);
	}, req.decoded.username)
});

module.exports = router;