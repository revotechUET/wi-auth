let ResponseJSON = require('../response');
let Model = require('../models-master');
let asyncEach = require('async/each');
let crypto = require('crypto');
let fs = require('fs');
let wiNotification = require('@revotechuet/wi-notification');
let notice;
if (process.env.AWS_SMTP_USER) {
    notice = new wiNotification({
        user: process.env.AWS_SMTP_USER,
        password: process.env.AWS_SMTP_PASSWORD
    });
}
function getRandomHash() {
    const current_date = (new Date()).valueOf().toString();
    const random = Math.random().toString();
    return (crypto.createHash('sha1').update(current_date + random).digest('hex'));
}

function createNewSharedProject(data, done, username) {
    // let conditions = username ? {username: username} : {username: data.username};
    let conditions = data.username ? { username: data.username } : { username: username };
    Model.User.findOne({ where: conditions }).then((user => {
        data.shareKey = getRandomHash();
        Model.SharedProject.findOrCreate({
            where: { project_name: data.name || data.project_name, idOwner: user.idUser },
            defaults: {
                project_name: data.name || data.project_name,
                shareKey: data.shareKey,
                idOwner: user.idUser
            }
        }).then(d => {
            done(ResponseJSON(200, "Successfull", d[0]));
        }).catch(err => {
            done(ResponseJSON(512, err, err));
        });
    }));
}

function removeSharedProject(data, done) {
    Model.User.findOne({ where: { username: data.createdBy } }).then(user => {
        if (user) {
            Model.SharedProject.findOne({ where: { idOwner: user.idUser, project_name: data.name } }).then(p => {
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
            Model.SharedProject.findOne({ where: { shareKey: data.shareKey } }).then(rs => {
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
                            if (data.username.indexOf("su_") == 0) {
                                data.username = data.username.slice(3);
                            }
                            Model.User.findOne({
                                where: {
                                    idCompany: data.idCompany,
                                    username: data.username
                                }
                            }).then(user => {
                                gr[0].addUser(user.idUser);
                                rs.addGroup(gr[0].idGroup, { through: { permission: defaultPerm } });
                                doNotification(gr[0].idGroup, rs, "add");
                                done(ResponseJSON(200, "Done", rs));
                            });
                        });
                    } else {
                        rs.addGroup(data.idGroup, { through: { permission: defaultPerm } });
                        doNotification(data.idGroup, rs, "add");
                        done(ResponseJSON(200, 'Successful', rs));
                    }
                } else {
                    done(ResponseJSON(512, "Share key isn't correct"));
                }

            }).catch(err => {
                done(ResponseJSON(512, err, err));
            });
        } else {
            Model.SharedProject.findByPk(data.idSharedProject).then(rs => {
                let defaultPerm = require('../utils/default-permission.json');
                rs.addGroup(data.idGroup, { through: { permission: defaultPerm } });
                doNotification(data.idGroup, rs, "add");
                done(ResponseJSON(200, 'Successful', data));
            }).catch(err => {
                done(ResponseJSON(512, err, err));
            });
        }
    } else if (data.type === "remove") {
        Model.SharedProject.findByPk(data.idSharedProject).then(rs => {
            rs.removeGroup(data.idGroup);
            doNotification(data.idGroup, rs, "remove");
            done(ResponseJSON(200, 'Successfully', data));
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
            { model: Model.User },
            { model: Model.Group, include: Model.Company }
        ]
    }).then(sps => {
        done(ResponseJSON(200, "Done", sps));
    });
}

function getSharedProjectList(data, done) {
    let listPrj = [];
    Model.User.findOne({
        where: { username: data.username },
        include: { model: Model.Group, include: { model: Model.SharedProject } }
    }).then(user => {
        asyncEach(user.groups, function (group, nextGroup) {
            asyncEach(group.shared_projects, function (sharedProject, nextProject) {
                Model.User.findByPk(sharedProject.idOwner).then(u => {
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
            done(ResponseJSON(200, "Successfully", listPrj));
        });
    });
}



function doNotification(idGroup, sharedProject, action) {
    Model.Group.findByPk(idGroup, { include: { model: Model.User } }).then(group => {
        group = group.toJSON()
        //all users in groups
        let users = group.users;
        let owner = users.find(u => u.idUser = sharedProject.idOwner);
        console.log("==DEBUG ", users.length, owner, sharedProject)
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            console.log("Do noti for user ", user.username, user.idUser, user.email, sharedProject.idOwner, owner.idUser);
            if (user.email && user.idUser !== sharedProject.idOwner) {
                if (action === "add") {
                    console.log(`Send shared notification to email ${user.email} for project ${sharedProject.project_name}`)
                    //let str = `Hi <b>${user.username}</b>,<br><br>Your group <b>${group.name}</b> has been shared new project named <b>${sharedProject.project_name}</b> by <b>${owner.username}</b><br/><p>If you have any question please contact us via email: <a href="mailto:support@i2g.cloud"> support@i2g.cloud></a></p><br><p>Best regards</p></br><p>The I2G Support team</p>`
                    let str = fs.readFileSync(__dirname + '/mail-template/add-share.html').toString()
                    str = str.replace("__USER__", user.username);
                    str = str.replace("__SHARED_USER__", owner.username);
                    str = str.replace("__PROJECT_NAME__", sharedProject.project_name);
                    if (user.idCompany === 43) {
                        //idCompany = 43 => BDPOC
                        str = str.replace("__WORKSPACE_URL__", "http://10.17.31.75:8080/")
                    } else {
                        str = str.replace("__WORKSPACE_URL__", process.env.WORKSPACE_URL ? process.env.WORKSPACE_URL : "https://wi.i2g.cloud")
                    }
                    notice && notice.sendMail({
                        to: user.email,
                        messageHtml: str,
                        subject: `[I2G Notification] ${owner.username} shared project ${sharedProject.project_name} with you!`
                    });
                } else if (action === "remove") {
                    console.log(`Send un-shared notification to email ${user.email} for project ${sharedProject.project_name}`)
                    // let str = `Hi <b>${user.username}</b>,<br><br>Your group <b>${group.name}</b> has been removed the project named <b>${sharedProject.project_name}</b> by <b>${owner.username}</b><br/><p>If you have any question please contact us via email: <a href="mailto:support@i2g.cloud"> support@i2g.cloud></a></p><br><p>Best regards</p></br><p>The I2G Support team</p>`
                    let str = fs.readFileSync(__dirname + '/mail-template/remove-share.html').toString()
                    str = str.replace("__USER__", user.username);
                    str = str.replace("__SHARED_USER__", owner.username);
                    str = str.replace("__PROJECT_NAME__", sharedProject.project_name);
                    if (user.idCompany === 43) {
                        //idCompany = 43 => BDPOC
                        str = str.replace("__WORKSPACE_URL__", "http://10.17.31.75:8080/")
                    } else {
                        str = str.replace("__WORKSPACE_URL__", process.env.WORKSPACE_URL ? process.env.WORKSPACE_URL : "https://wi.i2g.cloud")
                    }
                    notice && notice.sendMail({
                        to: user.email,
                        messageHtml: str,
                        subject: `[I2G Notification] ${owner.username} stop sharing project ${sharedProject.project_name} with you!`
                    });
                } else {
                    console.log("Send notification error, do not recognize action")
                }

            }
        }
    })
}


module.exports = {
    createNewSharedProject: createNewSharedProject,
    getSharedProjectList: getSharedProjectList,
    addToGroup: addToGroup,
    removeSharedProject: removeSharedProject,
    getAllSharedProject: getAllSharedProject
};