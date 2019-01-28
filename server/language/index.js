const models = require('../models-master');
const UserLanguage = models.UserLanguage;
const express = require('express');
const router = express.Router();
const ResponseJSON = require('../response');


router.post('/user-language/get', (req, res) => {
	UserLanguage.findOne({where: {key: req.body.key}}).then(rs => {
		res.send(ResponseJSON(200, "Done", rs));
	})
});
router.post('/user-language/update', (req, res) => {
	UserLanguage.findOne({where: {key: req.body.key}}).then(rs => {
		if (rs) {
			rs.content = req.body.content;
			rs.save().then(r => {
				res.send(ResponseJSON(200, "Done", r));
			}).catch(err => {
				res.send(ResponseJSON(512, err.message, err));
			})
		} else {
			res.send(ResponseJSON(512, "Not found", rs));
		}
	})
});

module.exports = router;