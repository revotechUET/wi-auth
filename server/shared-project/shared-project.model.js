let ResponseJSON = require('../response');
let Model = require('../models-master');
let asyncEach = require('async/each');

function getRandomHash() {
	const current_date = (new Date()).valueOf().toString();
	const random = Math.random().toString();
	return (crypto.createHash('sha1').update(current_date + random).digest('hex'));
}

function createNewSharedProject(data, done, username) {
    // let conditions = username ? {username: username} : {username: data.username};
    let conditions = data.username ? {username: data.username} : {username: username};
    Model.User.findOne({where: conditions}).then((user => {
        data.shareKey = getRandomHash();
        Model.SharedProject.findOrCreate({
            where: {project_name: data.name, idOwner: user.idUser},
            defaults: data
        }).then(d => {
            done(ResponseJSON(200, "Successfull", d[0]));
        }).catch(err => {
            done(ResponseJSON(512, err, err));
        });
    }));
}

function removeSharedProject(data, done) {
    Model.User.findOne({where: {username: data.createdBy}}).then(user => {
        if (user) {
            Model.SharedProject.findOne({where: {idOwner: user.idUser, project_name: data.name}}).then(p => {
                if (p) {
                    p.destroy().then(() => {
                        done(ResponseJSON(200, "Done", p));
                    })
                } else {
                    done(ResponseJSON(512, "No shared project found"));
                }
            });
        } else {
            done(ResponseJSON(512, "No user found"));
        }
    });
}

function addToGroup(data, done) {
    if (data.type === "add") {
        if (data.shareKey) {
            Model.SharedProject.findOne({where: {shareKey: data.shareKey}}).then(rs => {
                if (rs) {
                    let defaultPerm = require('../utils/default-permission.json');
                    if (data.idGroup === 0) {
                        Model.Group.findOrCreate({
                            where: {
                                name: data.company + "-" + data.username,
                                idCompany: data.idCompany
                            }, defaults: {
                                name: data.company + "-" + data.username,
                                idCompany: data.idCompany
                            }
                        }).then(gr => {
                            Model.User.findOne({
                                where: {
                                    idCompany: data.idCompany,
                                    username: data.username
                                }
                            }).then(user => {
                                gr[0].addUser(user.idUser);
                                rs.addGroup(gr[0].idGroup, {through: {permission: defaultPerm}});
                                done(ResponseJSON(200, "Done"));
                            });
                        });
                    } else {
                        rs.addGroup(data.idGroup, {through: {permission: defaultPerm}});
                        done(ResponseJSON(200, 'Successful', data));
                    }
                } else {
                    done(ResponseJSON(512, "Share key isn't correct"));
                }

            }).catch(err => {
                done(ResponseJSON(512, err, err));
            });
        } else {
            Model.SharedProject.findById(data.idSharedProject).then(rs => {
                let defaultPerm = require('../utils/default-permission.json');
                rs.addGroup(data.idGroup, {through: {permission: defaultPerm}});
                done(ResponseJSON(200, 'Successful', data));
            }).catch(err => {
                done(ResponseJSON(512, err, err));
            });
        }
    } else if (data.type === "remove") {
        Model.SharedProject.findById(data.idSharedProject).then(rs => {
            rs.removeGroup(data.idGroup);
            done(ResponseJSON(200, 'Successfull', data));
        }).catch(err => {
            done(ResponseJSON(512, err, err));
        });
    } else {
        done(ResponseJSON(512, "Type must be 'add' or 'remove'"));
    }


}

function getAllSharedProject(data, done) {
    Model.SharedProject.findAll({
        include: [
            {model: Model.User},
            {model: Model.Group, include: Model.Company}
        ]
    }).then(sps => {
        done(ResponseJSON(200, "Done", sps));
    });
}

function getSharedProjectList(data, done) {
    let listPrj = [];
    Model.User.findOne({
        where: {username: data.username},
        include: {model: Model.Group, include: {model: Model.SharedProject}}
    }).then(user => {
        asyncEach(user.groups, function (group, nextGroup) {
            asyncEach(group.shared_projects, function (sharedProject, nextProject) {
                Model.User.findById(sharedProject.idOwner).then(u => {
                    let found = listPrj.filter(x => x.owner === u.username && x.name === sharedProject.project_name);
                    if (found.length === 0 && u.username !== data.username) {
                        listPrj.push({
                            owner: u.username,
                            name: sharedProject.project_name,
                            shareKey: sharedProject.shareKey,
                            group: group.name
                        });
                    }
                    nextProject();
                });
            }, function () {
                nextGroup();
            });
        }, function () {
            done(ResponseJSON(200, "Successfull", listPrj));
        });
    });
}

module.exports = {
    createNewSharedProject: createNewSharedProject,
    getSharedProjectList: getSharedProjectList,
    addToGroup: addToGroup,
    removeSharedProject: removeSharedProject,
    getAllSharedProject: getAllSharedProject
};