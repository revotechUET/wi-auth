var express = require('express');
var app = express();
var fullConfig = require('config');
var config = fullConfig.Application;

//Router
var authenRouter = require('./server/authenticate/authenticate.router');

var http = require('http').Server(app);

//use authenticate
app.use('/',authenRouter);
var authenticate = require('./server/authenticate/authenticate');
app.use(authenticate());


app.get('/', function (req,res) {
    res.send("Welcome to WI-Authentication");
});
http.listen(config.port, function() {
    console.log("Listening on port" + config.port);
});
