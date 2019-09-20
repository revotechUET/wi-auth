const express = require('express');
const router = express.Router();
const Model = require('./license.model');


router.post('/user/license', (req, res) => {
    Model.getUserLicense(req.body, (status) => {
        res.send(status);
    }, req.decoded.username)
});

router.post('/license-package/list', (req, res) => {
    Model.getAllLicensePackages(req.body, (status) => {
        res.send(status);
    })
});

router.post('/license-package/new', (req, res) => {
    Model.newLicensePackage(req.body, (status) => {
        res.send(status);
    })
});

router.post('/license-package/delete', (req, res) => {
    Model.deleteLicensePackage(req.body, status => {
        res.send(status);
    })
});

router.post('/license-package/edit', (req, res) => {
    Model.editLicensePackage(req.body, (status) => {
        res.send(status);
    })
});

router.post('/feature/list', (req, res) => {
    Model.getAllLicenseFeature(req.body, status => {
        res.send(status);
    });
});

router.post('/feature/delete', (req, res) => {
    Model.deleteFeature(req.body, status => {
        res.send(status);
    });
});

module.exports = router;