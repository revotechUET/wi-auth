let router = require('express').Router();
let bodyParser = require('body-parser');
let shareProjectModel = require('./shared-project.model');
router.use(bodyParser.json());

router.post('/shared-project/new', function (req, res) {
    shareProjectModel.createNewSharedProject(req.body, function (status) {
        res.send(status);
    }, req.decoded.username);
});

router.post('/shared-project/list', function (req, res) {
    shareProjectModel.getSharedProjectList(req.body, function (status) {
        res.send(status);
    });
});

router.post('/shared-project/add-to-group', function (req, res) {
    shareProjectModel.addToGroup(req.body, function (status) {
        res.send(status);
    });
});
module.exports = router;