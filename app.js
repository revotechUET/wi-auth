let express = require('express');
let app = express();
let fullConfig = require('config');
let config = fullConfig.Application;
let cors = require('cors');

//Router
let authenRouter = require('./server/authenticate/authenticate.router');
let userRouter = require('./server/user/user.router');
let captchaRouter = require('./server/captcha/captcha').router;
let groupRouter = require('./server/group/group.router');
let authenticate = require('./server/authenticate/authenticate');
// let authorize = require('./server/authorize/authorize');
let sharedProjectRouter = require('./server/shared-project/shared-project.router');
let companyRouter = require('./server/company/company.router');
let http = require('http').Server(app);

//use authenticate
app.use(cors());
app.use('/', authenRouter);
app.use('/', captchaRouter);
app.use(authenticate());
// app.use(authorize());
app.use('/', userRouter);
app.use('/', groupRouter);
app.use('/', sharedProjectRouter);
app.use('/', companyRouter);

app.get('/test', (req, res) => {
	res.send("v1.0");
});


app.get('/', function (req, res) {
	res.send("Welcome to WI-Authentication Service");
});
http.listen(config.port, function () {
	console.log("Listening on port " + config.port);
});
