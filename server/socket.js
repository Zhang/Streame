'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);
  var userId;

  io.on('connection', function(socket) {
    socket.on('message', function (message) {
      socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function(req) {
      socket.on('toggleVideo', function(vid) {
        var nsp = io.of(req.channel);
        nsp.emit('toggleVideo', vid);
      });

      socket.on('toggleImage', function(img) {
        var nsp = io.of(req.channel);
        nsp.emit('toggleImage', img);
      });

      socket.on('remove stream', function(stream) {
        var nsp = io.of(req.channel);
        nsp.emit('remove stream', stream);
      });

      var ONE_USER = 1;
      socket.join(req.channel);
      var newRoom = _.keys(io.nsps['/'].adapter.rooms[req.channel]).length === ONE_USER;

      if (newRoom || req.isBroadcaster) {
        userId = req.peerId;
        socket.emit('create', userId);
        //socket.broadcast.emit('join', userId);
      } else {
        socket.emit('join', req.peerId);
        socket.broadcast.emit('joined', req.peerId);
      }
    });
  });
};
