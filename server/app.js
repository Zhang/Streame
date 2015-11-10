'use strict';

var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);

require('./socket.js')(server);

var bodyParser = require('body-parser');
var config = require('./config');

app.use(bodyParser());
app.use(express.static(__dirname + '/../public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/../public/index.html');
});

server.listen(config.port, function() {
  console.log(
    'serving port: ' + config.port +' in ' + config.env + ' environment'
  );
});
