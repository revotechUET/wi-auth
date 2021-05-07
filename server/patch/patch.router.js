const express = require('express');
const router = express.Router();
let { Company, User, Group } = require("../models-master/index");
let Model = require('../models-master/index');


router.get('/patch', (req, res) => {
    switch (req.query.v) {
        case "addGroup": {
            Company.findAll({ include: { model: User } }).then(async companies => {
                let resp = [];
                for (let i = 0; i < companies.length; i++) {
                    for (let j = 0; j < companies[i].users.length; j++) {
                        let gr = (await Group.findOrCreate({
                            where: {
                                name: companies[i].name + "-" + companies[i].users[j].username,
                                idCompany: companies[i].idCompany
                            }, defaults: {
                                name: companies[i].name + "-" + companies[i].users[j].username,
                                idCompany: companies[i].idCompany
                            }
                        }))[0];
                        await gr.addUser(companies[i].users[j].idUser);
                    }
                }
                let grs = await Group.findAll({ include: { model: User } });
                res.send(grs);
            });
            break;
        }
        case "resetPermission": {
            Model.SharedProjectGroup.findAll().then(async rs => {
                let resp = [];
                for (let i = 0; i < rs.length; i++) {
                    let newObj = rs[i].toJSON();
                    let newPerm = require('../utils/default-permission.json');
                    newObj.permission = newPerm;
                    resp.push(await Object.assign(rs[i], newObj).save())
                }
                res.send(resp);
            })
            break;
        }
    }
});

module.exports = router;