'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);
  io.on('connection', function(socket) {
    socket.on('create or join', function(room) {
      var ONE_USER = 1;
      var createRoom = _.keys(io.of('/').connected).length === ONE_USER;

      socket.join(room, function(err) {
        if (err) return console.log(err);
        io.of(room).emit('log');
        if (createRoom) {
          socket.emit('created');
        } else {
          socket.emit('joined');
        }
      });
    });
  });
};
