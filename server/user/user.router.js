let express = require('express');
let router = express.Router();
let model = require('./user.model');
let bodyParser = require('body-parser');
router.use(bodyParser.json());

router.post('/user/list', function (req, res) {
    model.listUser(req.body, function (status) {
        res.send(status);
    });
});

router.post('/user/new', function (req, res) {
    model.createUser(req.body, function (status) {
        res.send(status);
    });
});

router.post('/user/info', function (req, res) {
    model.infoUser(req.body, function (status) {
        res.send(status);
    });
});

router.post('/user/edit', function (req, res) {
    model.editUser(req.body, function (status) {
        res.send(status);
    });
});

router.post('/user/delete', function (req, res) {
    model.deleteUser(req.body, function (status) {
        res.send(status);
    });
});

router.post('/user/dropdb', function (req, res) {

});

router.post('/user/get-permission', function (req, res) {
    model.getPermission(req.body, function (status) {
        res.send(status)
    }, req.decoded.username);
});

module.exports = router;