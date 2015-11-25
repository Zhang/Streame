'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);
  var hosts = {};

  //need to ensure sockets can only be in one room at a time
  io.on('connection', function(socket) {
    // All socket messages contain :
    // { channel: String, peerId: String}
    socket.on('add peer', function(msg) {
      hosts[msg.channel].socket.emit('joined', msg);
    });
    socket.on('toggleVideo', function(msg) {
      var nsp = io.of(msg.channel);
      nsp.emit('toggleVideo', msg);
    });
    socket.on('toggleGif', function(msg) {
      var nsp = io.of(msg.channel);
      nsp.emit('toggleGif', msg);
    });
    socket.on('toggleImage', function(msg) {
      var nsp = io.of(msg.channel);
      nsp.emit('toggleImage', msg);
    });
    socket.on('reconnected', function(msg) {
      socket.broadcast.emit('reconnected', msg.channel);
    });
    socket.on('remove stream', function(msg) {
      var nsp = io.of(msg.channel);
      nsp.emit('remove stream', msg);
    });
    socket.on('chat-sent', function(msg) {
      var nsp = io.of(msg.channel);
      nsp.emit('chat-received', msg);
    });
    socket.on('create or join', function(msg) {
      var ONE_USER = 1;
      socket.join(msg.channel);
      var newRoom = _.keys(io.nsps['/'].adapter.rooms[msg.channel]).length === ONE_USER;
      var isBroadcaster = _.get(hosts[msg.channel], 'id') === msg.peerId;

      if (newRoom || isBroadcaster) {
        hosts[msg.channel] = {
          id: msg.peerId,
          socket: socket
        };

        socket.emit('create', {
          channel: msg.channel,
          isReconnection: isBroadcaster
        });
      } else {
        socket.emit('join', msg);
      }
    });
  });
};
