'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);
  io.on('connection', function(socket) {
    socket.on('message', function (message) {
      //update to broadcast to specific rooms
      socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function() {
      var ONE_USER = 1;
      var createRoom = _.keys(io.of('/').connected).length === ONE_USER;
      console.log(io.of('/').connected);
      if (createRoom) {
        socket.emit('created');
      } else {
        io.emit('joined');
      }
    });
  });
};
