const express = require('express');
let router = express.Router();
let companyModel = require('./company.model');

router.post('/company/new', function (req, res) {
    companyModel.createCompany(req.body, function (status) {
        res.send(status);
    });
});

router.post('/company/info', function (req, res) {
    companyModel.infoCompany(req.body, function (status) {
        res.send(status);
    });
});

router.post('/company/delete', function (req, res) {
    companyModel.deleteCompany(req.body, function (status) {
        res.send(status);
    });
});

router.post('/company/edit', function (req, res) {
    companyModel.editCompany(req.body, function (status) {
        res.send(status);
    });
});

router.post('/company/list', function (req, res) {
    companyModel.listCompany(req.body, function (status) {
        res.send(status);
    });
});

module.exports = router;