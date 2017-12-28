const express = require('express');
const router = express.Router();
let models = require('../models-master');
let bodyParser = require('body-parser');
let config = require('config').backend_service;
let User = models.User;
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;
let jwt = require('jsonwebtoken');
let md5 = require('md5');
let refreshTokenModel = require('./refresh-token');
let captchaList = require('../captcha/captcha').captchaList;
let secretKey = "secretKey";
router.use(bodyParser.json());

router.post('/refresh-token', function (req, res) {
    let refreshToken = req.body.refresh_token || req.query.refresh_token || req.header['x-access-refresh-token'];
    refreshTokenModel.checkRefreshToken(refreshToken, function (result) {
        if (result) {
            User.findById(result.idUser).then(user => {
                refreshTokenModel.renewRefreshToken(result.refreshToken, function (newToken) {
                    let token = jwt.sign({username: user.username}, secretKey, {expiresIn: '24h'});
                    let response = {};
                    response.token = token;
                    response.refresh_token = newToken;
                    res.status(200).send(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", response));
                });
            })
        } else {
            res.status(200).send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Refresh token expired!"));
        }
    });
});

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
                                    let token = jwt.sign(req.body, secretKey, {expiresIn: '24h'});
                                    let response = new Object();
                                    response.token = token;
                                    refreshTokenModel.createRefreshToken(user.idUser, function (refreshToken) {
                                        response.refresh_token = refreshToken;
                                        return res.send(ResponseJSON(ErrorCodes.SUCCESS, "Successful", response));
                                    });
                                }
                                // return res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Backend Service problem."));
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
            var token = jwt.sign(req.body, secretKey, {expiresIn: '1h'});
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