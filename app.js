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

// Check connection to database
let Sequelize = require('sequelize');
let configDb = require('config').Database;
const sequelize = new Sequelize(process.env.AUTH_DBNAME || configDb.dbName, process.env.AUTH_DBUSER || configDb.user, process.env.AUTH_DBPASSWORD || configDb.password, {
	host: process.env.AUTH_DBHOST || configDb.host,
	define: {
		freezeTableName: true
	},
	dialect: process.env.AUTH_DBDIALECT || configDb.dialect,
	port: process.env.AUTH_DBPORT || configDb.port,
	logging: false,
	pool: {
		max: 20,
		min: 0,
		idle: 200
	},
	storage: process.env.AUTH_DBSTORAGE || configDb.storage,
	operatorsAliases: Sequelize.Op
});
sequelize.authenticate()
	.then(() => {
		console.log('Connection has been established successfully.');
		main();
	})
	.catch(err => {
		console.error('Unable to connect to the database:', err);
		process.exit(0);
	});


function main() {
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
		res.json({serverId: serverId, version: 4.0});
	});
	app.get('/test', (req, res) => {
		setTimeout(() => {
			res.json({serverId: serverId, version: 4.0});
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

	http.listen(process.env.AUTH_PORT || config.port, function () {
		console.log("Listening on port " + (process.env.AUTH_PORT || config.port), " Server ID: ", serverId);
	});
}
