'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);
  var nsp = io.of('/123');
  nsp.on('connection', function() {
    console.log('someone connected');
  });
  nsp.emit('hi', 'everyone!');
  io.on('connection', function(socket) {
    socket.on('message', function (message) {
      //update to broadcast to specific rooms
      socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function(room) {
      var ONE_USER = 1;
      socket.join(room);
      var createRoom = _.keys(io.nsps['/'].adapter.rooms[room]).length === ONE_USER;

      if (createRoom) {
        socket.emit('create');
      } else {
        io.emit('join');
      }
    });
  });
};
