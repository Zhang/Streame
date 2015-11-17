'use strict';

var express = require('express');
var http = require('http');
var app = express();
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var server = http.createServer(app);
var ExpressPeerServer = require('peer').ExpressPeerServer;

require('./socket.js')(server);

var config = require('./config');

var A_LONG_TIME = 1000000000000;

app.use(cookieSession({
  maxAge: A_LONG_TIME,
  keys: ['key1', 'key2'],
  name: 'scott'
}));

app.use(cookieParser());
app.use(function(req, res, next) {
  res.cookie('cookieId', req.cookies.cookieId || require('uuid').v4());
  res.cookie('host', process.env.HOST || 'localhost');
  next();
});

app.use(express.static(__dirname + '/../public'));

app.use('/peerjs', ExpressPeerServer(server, { debug: true }));
server.listen(config.port, function() {
  console.log(
    'serving port: ' + config.port +' in ' + config.env + ' environment'
  );
});
