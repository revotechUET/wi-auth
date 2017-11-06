var express = require('express');
var app = express();
var fullConfig = require('config');
var config = fullConfig.Application;
var cors = require('cors');

//Router
var authenRouter = require('./server/authenticate/authenticate.router');
var userRouter = require('./server/user/user.router');

var http = require('http').Server(app);

//use authenticate
app.use(cors());
app.use('/',authenRouter);
app.use(userRouter);
// var authenticate = require('./server/authenticate/authenticate');
// app.use(authenticate());


app.get('/', function (req,res) {
    res.send("Welcome to WI-Authentication");
});
http.listen(config.port, function() {
    console.log("Listening on port" + config.port);
});
