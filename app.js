let express = require('express');
let app = express();
let fullConfig = require('config');
let config = fullConfig.Application;
let cors = require('cors');
let crypto = require('crypto');
let serverId = getRandomHash();

function getRandomHash() {
	const current_date = (new Date()).valueOf().toString();
	const random = Math.random().toString();
	return (crypto.createHash('sha1').update(current_date + random).digest('hex'));
}


//Router
let authenRouter = require('./server/authenticate/authenticate.router');
let userRouter = require('./server/user/user.router');
let captchaRouter = require('./server/captcha/captcha').router;
let groupRouter = require('./server/group/group.router');
let authenticate = require('./server/authenticate/authenticate');
// let authorize = require('./server/authorize/authorize');
let sharedProjectRouter = require('./server/shared-project/shared-project.router');
let companyRouter = require('./server/company/company.router');
let userLanguageRouter = require('./server/language');
let http = require('http').Server(app);

app.get('/', function (req, res) {
	res.json({serverId: serverId});
});
app.get('/test', (req, res) => {
	setTimeout(() => {
		res.json({serverId: serverId});
	}, 4000);
});

//use authenticate
app.use(cors());
app.use('/', authenRouter);
app.use('/', captchaRouter);
app.use('/', userLanguageRouter);
app.use(authenticate());
// app.use(authorize());
app.use('/', userRouter);
app.use('/', groupRouter);
app.use('/', sharedProjectRouter);
app.use('/', companyRouter);

http.listen(config.port, function () {
	console.log("Listening on port " + config.port, " Server ID: ", serverId);
});
