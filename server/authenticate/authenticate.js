let jwt = require('jsonwebtoken');
let User = require('../models-master/User');
const fetch = require('node-fetch');
const axios = require('axios');
const querystring = require('query-string');
const jwtDecode = require('jwt-decode');
//this path can be used without authentication
const skipList = [
    '/company/list',
    '^/pattern.*',
    '/csv/.*'
];

module.exports = function () {
    return  async function (req, res, next) {
        //handle exception path
        if (new RegExp(skipList.join('|')).test(req.originalUrl)) return next();
        let token = req.body.token || req.query.token || req.header['x-access-token'] || req.get('Authorization');
        let url = req.url;
        if (token) {            
            // console.log("token to introspect", token);
            try {
                let response = await axios.post('http://127.0.0.1:4445/oauth2/introspect', querystring.stringify({
                    token: token
                }))
                response = response.data
                if (response.active) {
                    let secretKey = 'secretKey';
                    let decoded = jwtDecode(req.get('Authorization'));
                    let data = decoded.ext;
                    req.decoded = decoded.ext;
                    let newToken = jwt.sign(data, secretKey);
                    req.headers['Authorization'] = newToken;
                    next();
                } else {
                    return res
                    .status(401)
                    .json({code: 401, success: false, message: 'Failed to authenticate.....'});
                }
            } catch (e) {
               console.error(e);
            }
        }            
        else if( url == '/oauth2/token' ){
            next();
        }
        else {
            return res.status(401).send({
                code: 401,
                success: false,
                message: 'No token provided...'
            });
        }
    }
};
