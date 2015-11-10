'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var config = require("./config");

app.use(bodyParser());
app.use(express.static(__dirname + '/../public'));

app.get('*', function(req, res, next) {
  res.sendFile(__dirname + '/../public/index.html');
});

app.listen(config.web.port, function() {
  console.log(
    'serving port: ' + config.web.port +' in ' + config.web.env + ' environment'
  );
});
