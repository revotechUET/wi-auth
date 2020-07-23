const express = require('express');
const app = express();
const fullConfig = require('config');
const config = fullConfig.Application;
const cors = require('cors');
const crypto = require('crypto');
const serverId = getRandomHash();
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('dotenv').config();

function getRandomHash() {
    const current_date = (new Date()).valueOf().toString();
    const random = Math.random().toString();
    return (crypto.createHash('sha1').update(current_date + random).digest('hex'));
}

//Router
let proxy = require('./server/wi-express-http-proxy');
let authenRouter = require('./server/authenticate/authenticate.router');
let userRouter = require('./server/user/user.router');
let captchaRouter = require('./server/captcha/captcha').router;
let groupRouter = require('./server/group/group.router');
let authenticate = require('./server/authenticate/authenticate');
let sharedProjectRouter = require('./server/shared-project/shared-project.router');
let companyRouter = require('./server/company/company.router');
let userLanguageRouter = require('./server/language');
let licenseRouter = require('./server/license/license.router');
let keysRouter = require('./server/keys/keys.router');
let logoutRouter = require('./server/authenticate/logout');
let http = require('http').Server(app);

app.use(express.static('public'));
app.get('/', async function (req, res) {
    res.json({serverId: serverId, version: 4.0});
    // const routes = require('express-list-endpoints')(app);
    // res.send(routes);
});

//use authenticate
app.use(cookieParser());
app.use(cors());
app.use(passport.initialize());
app.use('/', authenRouter);
app.use('/', userLanguageRouter);
app.post('/utm-zones', proxy());
app.use(authenticate());
app.get('/sync', async function (req, res) {
    await require('./server/license/sync-feature-api')();
    res.json("Sync successfully");
});
app.use(proxy());
app.use('/', userRouter);
app.use('/', groupRouter);
app.use('/', sharedProjectRouter);
app.use('/', companyRouter);
app.use('/', licenseRouter);
app.use('/', keysRouter);
app.use('/', logoutRouter);
http.listen(process.env.AUTH_PORT || config.port, function () {
    console.log("Listening on port " + (process.env.AUTH_PORT || config.port), " Server ID: ", serverId);
});
