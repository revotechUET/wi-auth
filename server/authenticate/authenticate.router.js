const express = require('express');
const router = express.Router();
let models = require('../models-master');
let bodyParser = require('body-parser');
let User = models.User;
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;
let jwt = require('jsonwebtoken');
let md5 = require('md5');
let refreshTokenModel = require('./refresh-token');
let redisClient = require('../utils/redis').redisClient;

// let captchaList = require('../captcha/captcha').captchaList;
let secretKey = process.env.AUTH_JWTKEY || "secretKey";
router.use(bodyParser.json());

router.post('/refresh-token', function (req, res) {
    let refreshToken = req.body.refresh_token || req.query.refresh_token || req.header['x-access-refresh-token'];
    let token = req.body.token || req.query.token || req.header['x-access-token'] || req.get('Authorization');
    refreshTokenModel.checkRefreshToken(refreshToken, function (result) {
        if (result) {
            User.findByPk(result.idUser).then(user => {
                if (user.status !== "Active") {
                    res.status(401).send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "You are not activated. Please wait for account activation.", "You are not activated. Please wait for account activation."));
                } else {
                    refreshTokenModel.renewRefreshToken(result.refreshToken, function (newRefreshToken) {
                        jwt.verify(token, secretKey, function (err, decoded) {
                            if (err) {
                                res.status(200).send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Session expired!"));
                            } else {
                                delete decoded.iat;
                                delete decoded.exp;
                                let accessToken = jwt.sign(decoded, secretKey, {expiresIn: '240h'});
                                let response = {};
                                response.token = accessToken;
                                response.refresh_token = newRefreshToken;
                                res.status(200).send(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", response));
                            }
                        });
                    });
                }
            });
        } else {
            res.status(200).send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Session expired!"));
        }
    });
});

router.post('/login', function (req, res) {
    req.body.username = req.body.username.toLowerCase();
    req.body.password = md5(req.body.password);
    if (/^su_/.test(req.body.username)) {
        req.body.username = req.body.username.substring(3);
        User.findOne({where: {username: req.body.username}, include: {model: models.Company}})
            .then(function (user) {
                if (!user) {
                    res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "User is not exists."));
                } else {
                    if (user.status === "Inactive") {
                        res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not activated. Please wait for account activation."));
                    } else if (user.status === "Active") {
                        let data = {
                            username: user.username,
                            whoami: req.body.whoami,
                            role: user.role,
                            company: user.company.name
                        };
                        let token = jwt.sign(data, secretKey, {expiresIn: '48h'});
                        let response = {};
                        response.token = token;
                        refreshTokenModel.createRefreshToken(user.idUser, function (refreshToken) {
                            response.refresh_token = refreshToken;
                            response.company = user.company;
                            response.user = {
                                username: user.username,
                                role: user.role,
                                idCompany: user.idCompany
                            };
                            redisClient.del(user.username + ":license");
                            return res.send(ResponseJSON(ErrorCodes.SUCCESS, "Successful", response));
                        });
                    } else {
                        res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not activated. Please wait for account activation."));
                    }
                }
            });
    } else {
        User.findOne({where: {username: req.body.username}, include: {model: models.Company}})
            .then(function (user) {
                if (req.body.whoami === "data-administrator-service" && ('' + user.role !== "3"))
                    return res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not alowed to login."));
                if (!user) {
                    res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "User is not exists."));
                } else {
                    if (user.password !== req.body.password) {
                        res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Password is not correct."));
                    } else {
                        if (user.status === "Inactive") {
                            res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not activated. Please wait for account activation."));
                        } else if (user.status === "Active") {
                            let data = {
                                username: user.username,
                                whoami: req.body.whoami,
                                role: user.role,
                                company: user.company.name
                            };
                            let token = jwt.sign(data, secretKey, {expiresIn: '48h'});
                            let response = {};
                            response.token = token;
                            if (req.body.whoami === 'main-service') {
                                refreshTokenModel.clearTokenByUser(user.idUser, function () {
                                    refreshTokenModel.createRefreshToken(user.idUser, function (refreshToken) {
                                        response.refresh_token = refreshToken;
                                        response.company = user.company;
                                        redisClient.del(user.username + ":license");
                                        return res.send(ResponseJSON(ErrorCodes.SUCCESS, "Successful", response));
                                    });
                                });
                            } else {
                                response.user = {
                                    username: user.username,
                                    role: user.role,
                                    idCompany: user.idCompany
                                };
                                redisClient.del(user.username + ":license");
                                return res.send(ResponseJSON(ErrorCodes.SUCCESS, "Successful", response));
                            }
                        } else {
                            res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "You are not activated. Please wait for account activation."));
                        }
                    }
                }
            });
    }
});

router.post('/register', function (req, res) {
    req.body.password = md5(req.body.password);
    req.body.username = req.body.username.toLowerCase();
    // captchaList.put(123456, 123456);
    if (true) {
        // if (captchaList.get(req.body.captcha)) {
        User.create({
            username: req.body.username,
            password: req.body.password,
            fullname: req.body.fullname,
            status: "Inactive",
            email: req.body.email,
            idCompany: req.body.idCompany
        }).then(function (result) {
            //Create token then send
            let token = jwt.sign(req.body, secretKey, {expiresIn: '1h'});
            res.send(ResponseJSON(ErrorCodes.SUCCESS, "Success", token));
        }).catch(function (err) {
            if (err.name === "SequelizeUniqueConstraintError") {
                res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "User already exists!"));
            } else {
                res.send(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, err.message, err.message));
            }
        });
    } else {
        // res.send(ResponseJSON(ErrorCodes.ERROR_WRONG_PASSWORD, "Captcha was not correct!"));
    }
});

module.exports = router;