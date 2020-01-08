const express = require('express');
let router = express.Router();
let companyModel = require('./company.model');
let models = require("../models-master/index");
let User = models.User;
let Company = models.Company;
let ResponseJSON = require('../response');
let userModel = require('./../user/user.model');
let author = require('./../authenticate/authorization');

router.post('/company/new', author.systemAdminOnly(), function (req, res) {
    companyModel.createCompany(req.body, function (status) {
        res.send(status);
    });
});

router.post('/company/info', function (req, res) {
    companyModel.infoCompany(req.body, function (status) {
        res.send(status);
    });
});

router.post('/company/delete', author.systemAdminOnly(), function (req, res) {
    companyModel.deleteCompany(req.body, function (status) {
        res.send(status);
    });
});

router.post('/company/edit', author.atLeastCompanyAdmin(), function (req, res) {
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

router.post('/company/get-licenses-left', async (req,res) => {
    let companyName = req.decoded.company;
    let role = req.decoded.role;

    if (role == 0) {
        try {
            let licenses = (await models.LicensePackage.findAll({where: {}}));
            for (let i = 0; i < licenses.length; i++) {
                licenses[i].dataValues.left = 999;                            
            }
            res.json(ResponseJSON(200, 'Successfully', licenses));
            return;
        } catch (e) {
            res.json(ResponseJSON(512, e.message, {}));
            return;
        }
        
    }

    try {
        let company = await Company.findOne({
            where: { name: companyName },
            include: {
                model: models.LicensePackage,
                attributes: ['idLicensePackage', 'name', 'description'],
                through: { attributes: ['value'] }
            },
            attributes: ['idCompany', 'name']
        });
        let licenses = (await models.LicensePackage.findAll({where: {}}));
        let users = (await models.User.findAll({where: {idCompany: company.idCompany}}));
        let licensesInCompany = company.license_packages.map((e)=>{
            return {idLicensePackage: e.idLicensePackage, value: e.company_license.value}
        });
        for (let i = 0; i < licenses.length; i++) {
            let arr = licensesInCompany.filter(e=>e.idLicensePackage == licenses[i].idLicensePackage);
            licenses[i].dataValues.left = (arr.length == 0 ? 0 : arr[0].value)
                                - users.filter(e=>e.idLicensePackage == licenses[i].idLicensePackage).length;                            
        }
        res.json(ResponseJSON(200, 'Successfully', licenses));
    } catch (e) {
        res.json(ResponseJSON(512, e.message, {}));
    }
    
});

router.post('/company/get-licenses', async (req, res)=>{
    try {
        let company = await Company.findByPk(req.body.idCompany, {
            include: {
                model: models.LicensePackage,
                attributes: ['idLicensePackage', 'name', 'description'],
                through: { attributes: ['value'] }
            },
            attributes: ['idCompany', 'name']
        });
        let licenses = (await models.LicensePackage.findAll({where: {}}));
        let licensesInCompany = company.license_packages.map((e)=>{
            return {idLicensePackage: e.idLicensePackage, value: e.company_license.value}
        });
        for (let i = 0; i < licenses.length; i++) {
            let arr = licensesInCompany.filter(e=>e.idLicensePackage == licenses[i].idLicensePackage);
            licenses[i].dataValues.value = (arr.length == 0 ? 0 : arr[0].value);
        }
        res.json(ResponseJSON(200, 'Successfully', licenses));
    } catch (e) {
        res.json(ResponseJSON(512, e.message, {}));
    }
});

module.exports = router;