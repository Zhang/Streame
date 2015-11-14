'use strict';

var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var ExpressPeerServer = require('peer').ExpressPeerServer;

require('./socket.js')(server);

var config = require('./config');

app.use(express.static(__dirname + '/../public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/../public/index.html');
});

app.use('/peerjs', ExpressPeerServer(server, { debug: true }));
server.listen(config.port, function() {
  console.log(
    'serving port: ' + config.port +' in ' + config.env + ' environment'
  );
});
