let Model = require('../models-master');
let responseJSON = require('../response');

function createNewGroup(data, done) {
    Model.Group.create(data).then(group => {
        done(responseJSON(200, "Successfull", group));
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

function listGroup(data, done) {
    Model.Group.findAll({include: {model: Model.User}}).then(groups => {
        done(responseJSON(200, "Successfull", groups));
    }).catch(err => {
        done(responseJSON(512, err, err));
    });
}

function addUserToGroup(data, done) {
    Model.Group.findById(data.idGroup).then(group => {
        if (group) {
            group.addUsers(data.idUsers, {through: {permission: 6}});
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
    Model.Group.findById(data.idGroup).then(group => {
        if (group) {
            group.removeUser(data.idUser);
            done(responseJSON(200, "Successfull", data));
        } else {
            done(responseJSON(512, "No group found by id"));
        }
    });
}

module.exports = {
    createNewGroup: createNewGroup,
    listGroup: listGroup,
    deleteGroup: deleteGroup,
    addUserToGroup: addUserToGroup,
    removeUser: removeUser
};