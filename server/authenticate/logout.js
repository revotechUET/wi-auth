const express = require('express');
const router = express.Router();
let models = require("../models-master/index");
let RefreshTokenModel = models.RefreshToken;
let ResponseJSON = require('../response');

router.post('/logout', (req, res) => {
    if (!req.body.client_id) return res.send(ResponseJSON(512, "Need client_id", "Need client_id in payload"));
    RefreshTokenModel.destroy({ where: { client_id: req.body.client_id }, truncate: true }).then(r => {
        res.send(ResponseJSON(200, "Done", r));
    }).catch(e => {
        res.send(ResponseJSON(512, "error", e));
    })
});

module.exports = router;