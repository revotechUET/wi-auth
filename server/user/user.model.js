"use strict";
let models = require("../models-master/index");
let User = models.User;
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;
let md5 = require('md5');
let config = require('config').backend_service;
// let models = require('../models');

// User.hook('beforeDestroy', function (user, option) {
//     let sequelize = user.sequelize;
//     let dbName = "wi_" + user.username.toLowerCase();
//     sequelize.query("DROP DATABASE IF EXISTS " + dbName).then(rs => {
//         let connetcion = models(dbName, function () {
//
//         }, true);
//         console.log("Done query : DROP DATABASE IF EXISTS " + dbName);
//     }).catch(err => {
//         console.log(err);
//     });
// });

function createUser(userInfo, done) {
    userInfo.password = md5(userInfo.password);
    User.create(userInfo).then(user => {
        done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    });
}

function infoUser(userInfo, done) {
    User.findById(userInfo.idUser).then(user => {
        if (user) {
            done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Error no user found"));
        }
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    })
}

function editUser(userInfo, done) {
    // userInfo.password = md5(userInfo.password);
    User.findById(userInfo.idUser).then(user => {
        if (user) {
            if (userInfo.newPassword) {
                userInfo.password = md5(userInfo.newPassword);
            }
            Object.assign(user, userInfo).save().then(rs => {
                done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", rs));
            }).catch(err => {
                done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "err", err));
            });
        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No user found"));
        }
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    })
}

function listUser(userInfo, done) {
    User.findAll().then(users => {
        if (userInfo.idGroup) {

        } else {
            done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", users));
        }
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    })

}

function deleteUser(userInfo, done) {
    User.findById(userInfo.idUser).then(user => {
        if (user) {
            User.destroy({where: {idUser: user.idUser}, individualHooks: true}).then(rs => {
                if (rs > 0) {
                    let request = require('request');
                    let dbName = 'wi_' + user.username.toLowerCase();
                    let host = config.host + ":" + config.port;
                    let options = {
                        uri: host + '/database/update',
                        method: 'DELETE',
                        json: {
                            "dbName": dbName
                        }
                    }
                    request(
                        options,
                        function (error, response, body) {
                            if (error) {
                                return done(ResponseJSON(ErrorCodes.INTERNAL_SERVER_ERROR, "BACKEND_SERVICE_ERROR"));
                            }

                            if (body.code == 200) {
                                return done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
                            }
                            done(body);
                        });

                }
            }).catch(err => {
                console.log(err);
                done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "err", err.message));
            });
        } else {
            done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "No user found"));
        }
    }).catch(err => {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Err", err.message));
    })
}

function dropDb(payload, done) {
    let request = require('request');
    let dbName = 'wi_' + payload.username.toLowerCase();
    let host = config.host + ":" + config.port;
    let options = {
        uri: host + '/database/update',
        method: 'DELETE',
        json: {
            "dbName": dbName
        }
    }
    request(
        options,
        function (error, response, body) {
            if (error) {
                return done(ResponseJSON(ErrorCodes.INTERNAL_SERVER_ERROR, "BACKEND_SERVICE_ERROR"));
            }

            if (body.code == 200) {
                return done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
            }
            done(body);
        });

}

module.exports = {
    createUser: createUser,
    infoUser: infoUser,
    deleteUser: deleteUser,
    listUser: listUser,
    editUser: editUser
}