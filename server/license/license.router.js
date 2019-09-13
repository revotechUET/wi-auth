const express = require('express');
const router = express.Router();
const Model = require('./license.model');


router.post('/user/license', (req, res) => {
	Model.getUserLicense(req.body, (status) => {
		res.send(status);
	}, req.decoded.username)
});

router.post('/license-package/list', (req, res) => {
    Model.getAllLicensePackages(req.body, (status) =>{
        res.send(status);
    })
})

module.exports = router;