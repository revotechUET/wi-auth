let express = require('express');
let router = express.Router();
let ResponseJSON = require('../response');

let GCPKEY = process.env.GCPKEY;

router.post("/keys/gcp-key", (req, res)=>{
    res.json(ResponseJSON(200, "success", {key: GCPKEY}));
});

module.exports = router;