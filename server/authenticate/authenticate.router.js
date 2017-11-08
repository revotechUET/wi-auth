const express = require('express');
const router = express.Router();
var models = require('../models-master');
var bodyParser = require('body-parser');
var config = require('config').backend_service;
var User = models.User;
var ResponseJSON = require('../response');
var ErrorCodes = require('../../error-codes').CODES;
var jwt = require('jsonwebtoken');
//var models = require('../models');
var md5 = require('md5');
let captchaList = require('../captcha/captcha').captchaList;
router.use(bodyParser.json());

// router.post('/login', function (req, res) {
//     req.body.password = md5(req.body.password);
//     User.findOne({where: {username: req.body.username}})
//         .then(function (user) {
//             if (!user) {
//                 res.status(401).send(ResponseJSON(ErrorCodes.ERROR_USER_NOT_EXISTS, "User not exist"))
//             } else {
//                 if (user.password != req.body.password) {
//                     res.status(401).send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Wrong password. Authenticate fail"))
//                 } else {
//                     var token = jwt.sign(req.body, 'secretKey', {expiresIn: '24h'});
//                     res.status(200).send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
//                 }
//             }
//         });
// });

router.post('/login', function (req, res) {
    req.body.password = md5(req.body.password);
    User.findOne({where: {username: req.body.username}})
        .then(function (user) {
            if (!user) {
                res.send(ResponseJSON(ErrorCodes.ERROR_USER_NOT_EXISTS, "USER_NOT_EXISTS"));
            } else {
                if (user.password != req.body.password) {
                    res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "WRONG_PASSWORD"));
                } else {
                    if (user.status == "Inactive") {
                        res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "NOT_ACTIVATED"));
                    } else if (user.status == "Active") {
                        /*var sequelize = user.sequelize;
                        var dbName = 'wi_' + user.username.toLowerCase();
                        sequelize.query('CREATE DATABASE IF NOT EXISTS ' + dbName).then(rs => {
                            // console.log(rs[0].warningStatus);
                            if (rs[0].warningStatus != 1) {
                                var dbConnection = models(dbName);
                                dbConnection.sequelize.sync()
                                    .then(function () {
                                        updateFamilyModel.syncFamilyData({username: user.username.toLowerCase()}, function (result) {
                                            var token = jwt.sign(req.body, 'secretKey', {expiresIn: '24h'});
                                            res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
                                            console.log("Successfull update family for user : ", dbName);
                                        });
                                    })
                                    .catch(function (err) {
                                        console.log(dbName + err);
                                    });
                            } else {
                                var token = jwt.sign(req.body, 'secretKey', {expiresIn: '24h'});
                                res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
                            }
                        });*/
                        var request = require('request');
                        var dbName = 'wi_' + user.username.toLowerCase();
                        var host = config.host + ":" + config.port;
                        var options = {
                            uri: host + '/database/update',
                            method: 'POST',
                            json: {
                                "dbName": dbName
                            }
                        }
                        request(
                            options,
                            function (error, response, body) {
                                if (error) {
                                    return res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "DATABASE_CREATION_FAIL"));
                                }

                                if (body.code == 200) {
                                    var token = jwt.sign(req.body, 'secretKey', {expiresIn: '24h'});
                                    return res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
                                }
                                return res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "DATABASE_CREATION_FAIL"));
                            });


                    } else {
                        res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "NOT_ACTIVATED"));
                    }
                }
            }
        });
});


// router.post('/register', function (req, res) {
//     req.body.password = md5(req.body.password);
//     User.create({username: req.body.username, password: req.body.password})
//         .then(function (result) {
//             //Create user's database;
//             var sequelize = result.sequelize;
//             var dbName = 'wi_' + result.username.toLowerCase();
//             sequelize.query('CREATE DATABASE ' + dbName);
//             //Create all tables then update family, family-condition
//             var dbConnection = models(dbName);
//             dbConnection.sequelize.sync()
//                 .then(function () {
//                     updateFamilyModel.syncFamilyData({username: result.username.toLowerCase()}, function (result) {
//                         console.log("Successfull update family for user : ", dbName);
//                     });
//                 })
//                 .catch(function (err) {
//                     console.log(dbName + err);
//                 });
//             //Create token then send
//             var token = jwt.sign(req.body, 'secretKey', {expiresIn: '1h'});
//             res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
//         })
//         .catch(function (err) {
//             res.status(401).send(ResponseJSON(ErrorCodes.ERROR_USER_EXISTED, "User existed!"));
//         })
// });
router.post('/register', function (req, res) {
    req.body.password = md5(req.body.password);
    if (captchaList.get(req.body.captcha)) {
        // captchaList.delete(req.body.captcha);
        User.create({
            username: req.body.username,
            password: req.body.password,
            fullname: req.body.fullname,
            email: req.body.email
        }).then(function (result) {
            //Create token then send
            var token = jwt.sign(req.body, 'secretKey', {expiresIn: '1h'});
            res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
        }).catch(function (err) {
            res.send(ResponseJSON(ErrorCodes.ERROR_USER_EXISTED, "USER_EXISTED"));
        })
    } else {
        // captchaList.delete(req.body.captcha);
        res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "WRONG_CAPTCHA"));
    }
});
module.exports = router;