"use strict";
let models = require("../models-master/index");
let User = models.User;
let ResponseJSON = require('../response');
let ErrorCodes = require('../../error-codes').CODES;
let md5 = require('md5');
let config = require('config').backend_service;
let async = require('async');

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
                    };
                    request(
                        options,
                        function (error, response, body) {
                            if (error) {
                                return done(ResponseJSON(ErrorCodes.INTERNAL_SERVER_ERROR, "BACKEND_SERVICE_ERROR"));
                            }

                            if (body.code === 200) {
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
    };
    request(
        options,
        function (error, response, body) {
            if (error) {
                return done(ResponseJSON(ErrorCodes.INTERNAL_SERVER_ERROR, "BACKEND_SERVICE_ERROR"));
            }

            if (body.code === 200) {
                return done(ResponseJSON(ErrorCodes.SUCCESS, "Successful", user));
            }
            done(body);
        });

}

function getPermission(payload, done, username) {
    let _user = payload.username || username;
    let permission = require('../utils/default-permission');
    for (let key in permission) {
        permission[key] = false;
    }
    if (!payload.project_name) {
        done(ResponseJSON(ErrorCodes.ERROR_INVALID_PARAMS, "Need projectname"));
    } else {
        User.findOne({
            where: {username: _user},
            include: {
                model: models.Group,
            }
        }).then(user => {
            async.each(user.groups, function (group, nextGroup) {
                models.Group.findById(group.idGroup, {
                    include: {
                        model: models.SharedProject,
                        where: {project_name: payload.project_name}
                    }
                }).then(g => {
                    if (g) {
                        async.each(g.shared_projects, function (sharedProject, next) {
                            for (let key in sharedProject.shared_project_group.permission) {
                                permission[key] = permission[key] || sharedProject.shared_project_group.permission[key];
                            }
                            next();
                        }, function () {
                            nextGroup();
                        });
                    } else {
                        nextGroup();
                    }
                })
            }, function () {
                done(ResponseJSON(ErrorCodes.SUCCESS, "Successfull", permission));
            });
        });
    }
}

module.exports = {
    createUser: createUser,
    infoUser: infoUser,
    deleteUser: deleteUser,
    listUser: listUser,
    editUser: editUser,
    getPermission: getPermission
};