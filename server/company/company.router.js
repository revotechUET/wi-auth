const express = require('express');
let router = express.Router();
let companyModel = require('./company.model');
let models = require("../models-master/index");
let User = models.User;
let Company = models.Company;
let ResponseJSON = require('../response');

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

router.post('/company/users', (req, res)=>{
    //this router return list user of your company
    let company = req.decoded.company;
    Company.findAll({where: {name: company}})
    .then((rs)=>{
        if (rs.length > 0) {
            let idCompany = rs[0].idCompany;
            User.findAll({where: {idCompany: idCompany}})
            .then(usersInCompany=>{
                res.json(ResponseJSON(200, 'Successfully', usersInCompany));
            }); 
        } else {
            res.json(ResponseJSON(512, 'Failed', {}));
        }
    });
    
    
});

module.exports = router;