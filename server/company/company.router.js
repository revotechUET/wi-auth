const express = require('express');
let router = express.Router();
let companyModel = require('./company.model');
let models = require("../models-master/index");
let User = models.User;
let Company = models.Company;
let ResponseJSON = require('../response');
let userModel = require('./../user/user.model');

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
    companyModel.listCompany(req, function (status) {
        res.send(status);
    });
});

router.post('/company/users', (req, res)=>{
    let company = req.decoded.company;
    let role = req.decoded.role;

    if (role == 0) {
        //this is admin
        userModel.listUser(req.body, function (status) {
            res.send(status);
        }, req.decoded);
        return;
    }

    Company.findAll({where: {name: company}})
    .then((rs)=>{
        if (rs.length > 0) {
            let idCompany = rs[0].idCompany;
            User.findAll({where: {idCompany: idCompany}})
            .then(usersInCompany=>{
                //find All project with
                res.json(ResponseJSON(200, 'Successfully', usersInCompany));
            }); 
        } else {
            res.json(ResponseJSON(512, 'Failed', {}));
        }
    });
});

module.exports = router;