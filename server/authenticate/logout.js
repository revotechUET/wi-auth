const express = require('express');
const router = express.Router();
let models = require("../models-master/index");
let RefreshTokenModel = models.RefreshToken;
let ResponseJSON = require('../response');

router.post('/logout', (req, res) => {
    if (!req.body.client_id) return res.send(ResponseJSON(512, "Need client_id", "Need client_id in payload"));
    RefreshTokenModel.findOne({ where: { client_id: req.body.client_id } }).then(r => {
        if (r) {
            r.destroy().then(() => {
                res.send(ResponseJSON(200, "Done", r));
            })
        } else {
            res.send(ResponseJSON(512, "Session not found", "Session not found"));
        }
    })
});

module.exports = router;