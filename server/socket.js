'use strict';

module.exports = function(app) {
  var io = require('socket.io')(app);
  io.on('connection', function(socket) {
    console.log('connected');
  });
};
