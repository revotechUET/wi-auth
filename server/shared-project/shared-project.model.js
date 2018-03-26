let ResponseJSON = require('../response');
let Model = require('../models-master');
let asyncEach = require('async/each');

function createNewSharedProject(data, done, username) {
    Model.User.findOne({where: {username: username}}).then((user => {
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

function addToGroup(data, done) {
    Model.SharedProject.findById(data.idSharedProject).then(rs => {
        rs.addGroups(data.idGroups);
        done(ResponseJSON(200, 'Successfull', data));
    }).catch(err => {
        done(ResponseJSON(512, err, err));
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
    addToGroup: addToGroup
};