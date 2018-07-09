let express = require('express');
let router = express.Router();
let bodyParser = require('body-parser');
let groupModel = require('./group.model');
router.use(bodyParser.json());

router.post("/group/new", function (req, res) {
    groupModel.createNewGroup(req.body, function (data) {
        res.send(data);
    }, req.decoded.username);
});

router.post("/group/list", function (req, res) {
    groupModel.listGroup(req.body, function (data) {
        res.send(data);
    }, req.decoded);
});

router.post("/group/delete", function (req, res) {
    groupModel.deleteGroup(req.body, function (data) {
        res.send(data);
    });
});

router.post("/group/add-user", function (req, res) {
    groupModel.addUserToGroup(req.body, function (data) {
        res.send(data);
    });
});

// groupModel.addUserToGroup({
//     idUser: 1,
//     idGroup: 2
// }, function (data) {
//     console.log('suc')
// });

router.post('/group/add-user-to-groups', function(req, res){
    groupModel.addUserToGroups(req.body, function(data) {
        res.send(data);
    })
});

router.post("/group/remove-user", function (req, res) {
    groupModel.removeUser(req.body, function (data) {
        res.send(data);
    });
});
router.post('/group/project-permission', function (req, res) {
    groupModel.getProjectPermission(req.body, function (data) {
        res.send(data);
    })
});
router.post('/group/update-project-permission', function (req, res) {
    groupModel.updateProjectPermission(req.body, function (data) {
        res.send(data);
    })
});

module.exports = router;