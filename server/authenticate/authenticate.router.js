const express = require('express');
const router = express.Router();
var models = require('../models-master');
var bodyParser = require('body-parser');
var config = require('config').backend_service;
var User = models.User;
var ResponseJSON = require('../response');
var ErrorCodes = require('../../error-codes').CODES;
var jwt = require('jsonwebtoken');
var md5 = require('md5');
let captchaList = require('../captcha/captcha').captchaList;
router.use(bodyParser.json());

router.post('/login', function (req, res) {
    req.body.password = md5(req.body.password);
    User.findOne({where: {username: req.body.username}})
        .then(function (user) {
            if (!user) {
                res.send(ResponseJSON(ErrorCodes.ERROR_USER_NOT_EXISTS, "User is not exists."));
            } else {
                if (user.password != req.body.password) {
                    res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Password is not correct."));
                } else {
                    if (user.status == "Inactive") {
                        res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "You are not activated. Please wait for account activation."));
                    } else if (user.status == "Active") {
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
                                    return res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Backend Service problem."));
                                }

                                if (body.code == 200) {
                                    var token = jwt.sign(req.body, 'secretKey', {expiresIn: '24h'});
                                    return res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
                                }
                                return res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Backend Service problem."));
                            });


                    } else {
                        res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "You are not activated. Please wait for account activation."));
                    }
                }
            }
        });
});


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
            res.send(ResponseJSON(ErrorCodes.ERROR_USER_EXISTED, "User already exists!"));
        })
    } else {
        // captchaList.delete(req.body.captcha);
        res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Captcha was not correct!"));
    }
});
module.exports = router;