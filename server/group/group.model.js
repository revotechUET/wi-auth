let Model = require('../models-master');
let responseJSON = require('../response');
let async = require('async');

async function createNewGroup(data, done, username) {
    let user = await Model.User.findOne({where: {username: username}});
    Model.Group.create(data).then(group => {
        group.addUser(user, {through: {permission: 1}});
        done(responseJSON(200, "Successfull", group));
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

async function listGroup(data, done, decoded) {
    if (decoded.whoami === 'main-service') {
        if (data.singleUser) {
            if (/^su_/.test(data.singleUser)) {
                data.singleUser = data.singleUser.substring(data.singleUser.indexOf('su_') + 3);
            }
            let user = await Model.User.findOne({where: {username: data.singleUser}, include: Model.Group});
            let response = user.groups;
            response.push({idGroup: 0, name: ">> Only Me <<"});
            done(responseJSON(200, 'Done', response));
        } else {
            let user = await Model.User.findOne({where: {username: decoded.username}});
            Model.Group.findAll({
                include: [{model: Model.User}, {model: Model.SharedProject}, {model: Model.Company}]
            }).then(groups => {
                let response = [];
                async.each(groups, function (group, nextGroup) {
                    if (group.idCompany === data.idCompany || group.shared_projects.find(p => p.idOwner === user.idUser)) {
                        response.push(group);
                    }
                    nextGroup();
                }, function () {
                    response.sort((a, b) => {
                        let nameA = a.name.toUpperCase();
                        let nameB = b.name.toUpperCase();
                        return nameA == nameB ? 0 : nameA > nameB ? 1 : -1;
                    });
                    done(responseJSON(200, "Successfull", response));
                });
            });
        }
    } else {
        if (decoded.role === 0) {
            Model.Group.findAll({include: {all: true}}).then((gs) => {
                done(responseJSON(200, "Done", gs));
            }).catch(err => {
                done(responseJSON(512, err.message, err.message));
            });
        } else if (decoded.role === 1) {
            Model.User.findOne({where: {username: decoded.username}}).then(user => {
                Model.Group.findAll({where: {idCompany: user.idCompany}, include: {all: true}}).then(gs => {
                    done(responseJSON(200, "Done", gs));
                });
            });
        } else {
            done(responseJSON(512, "No permission", "No permission"));
        }
    }
}

function addUserToGroup(data, done) {
    Model.Group.findById(data.idGroup).then(group => {
        if (group) {
            group.addUser(data.idUser, {through: {permission: 2}});
            done(responseJSON(200, "Successfull", data));
        } else {
            done(responseJSON(512, "No group found by id"));
        }
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

function deleteGroup(data, done) {
    Model.Group.findById(data.idGroup).then(group => {
        if (group) {
            group.destroy().then(() => {
                done(responseJSON(200, "Successfull", group));
            })
        } else {
            done(responseJSON(512, "No group found by id"));
        }
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

function removeUser(data, done) {
    Model.Group.findById(data.idGroup, {include: {model: Model.User, where: {idUser: data.idUser}}}).then(group => {
        if (group) {
            if (group.users[0].user_group_permission.permission === 1) {
                done(responseJSON(200, "CANT_REMOVE_OWNER", "CANT_REMOVE_OWNER"));
            } else {
                group.removeUser(data.idUser);
                done(responseJSON(200, "Successfull", data));
            }
        } else {
            done(responseJSON(512, "No group found by id"));
        }
    });
}

function getProjectPermission(data, done) {
    if (!data.project_name) return done(responseJSON(512, "Need Project Name"));
    Model.Group.findById(data.idGroup, {
        include: {
            model: Model.SharedProject,
            where: {project_name: data.project_name}
        }
    }).then(group => {
        if (!group) {
            done(responseJSON(200, "Successfull", {}));
        } else {
            if (group.shared_projects.length !== 0) {
                done(responseJSON(200, "Successfull", group.shared_projects[0].shared_project_group.permission));
            } else {
                done(responseJSON(200, "Successfull", {}));
            }
        }
    });
}

function updateProjectPermission(data, done) {
    Model.User.findOne({where: {username: data.username}}).then(user => {
        if (user) {
            Model.SharedProject.findOne({
                where: {
                    project_name: data.project_name,
                    idOwner: user.idUser
                }
            }).then(shared_project => {
                if (shared_project) {
                    Model.SharedProjectGroup.findOne({
                        where: {
                            idGroup: data.idGroup,
                            idSharedProject: shared_project.idSharedProject
                        }
                    }).then(perm => {
                        if (perm) {
                            let newPerm = perm.toJSON();
                            newPerm.permission = data.permission;
                            Object.assign(perm, newPerm).save().then((p) => {
                                done(responseJSON(200, "Successful", p))
                            }).catch(err => {
                                done(responseJSON(512, err.message, err));
                            });
                        } else {
                            Model.SharedProjectGroup.create({
                                idGroup: data.idGroup,
                                idSharedProject: shared_project.idSharedProject,
                                permission: data.permission
                            }).then(p => {
                                done(responseJSON(200, "Successful create new perm", p));
                            }).catch(err => {
                                done(responseJSON(512, err, {}));
                            });
                        }
                    })
                } else {
                    done(responseJSON(200, "No shared project found", {}));
                }
            });
        } else {
            done(responseJSON(200, "No user found", {}));
        }
    });
}

async function addUserToGroups(data, done) {
    try {
        const listGroupPromise = data
            .idGroups
            .map(group => {

                const {id} = group;
                if (group.type === 'remove') {
                    return Model.Group.findById(id, {include: {model: Model.User, where: {idUser: data.idUser}}});
                } else {
                    return Model.Group.findById(id);
                }
            });

        const groups = await Promise.all(listGroupPromise);

        groups.forEach(group => {

            if (group) {
                if (group.users && group.users.length && group.users[0].user_group_permission.permission >= 2) {
                    console.log('remove');
                    group.removeUser(data.idUser);
                } else {
                    console.log('add');
                    group.addUser(data.idUser, {through: {permission: 2}});
                }
            }

        })

        done(responseJSON(200, "Successfull", data));


    } catch (err) {
        console.log(err);
        done(responseJSON(512, err, err));
    }
}

async function addUsersToGroup(data, done) {
    try {
        const group = await Model.Group.findById(data.idGroup);

        data.idUsers.forEach(id => {
            group.addUser(id)
        })

        done(responseJSON(200, "Successfull", data));


    } catch (err) {
        console.log(err);
        done(responseJSON(512, err, err));
    }
}

module.exports = {
    createNewGroup: createNewGroup,
    listGroup: listGroup,
    deleteGroup: deleteGroup,
    addUserToGroup: addUserToGroup,
    removeUser: removeUser,
    getProjectPermission: getProjectPermission,
    updateProjectPermission: updateProjectPermission,
    addUserToGroups,
    addUsersToGroup
};
