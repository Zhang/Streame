'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);
  var hosts = {};
  io.on('connection', function(socket) {
    socket.on('message', function (message) {
      socket.broadcast.emit('message', message);
    });

    //need to ensure sockets can only be in one room at a time
    socket.on('create or join', function(req) {
      socket.on('add peer', function(peerId) {
        hosts[req.room].socket.emit('joined', peerId);
      });
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
      var isBroadcaster = _.get(hosts[req.room], 'id') === req.peerId;
      console.log(hosts[req.room]);
      console.log(io.nsps['/'].adapter.rooms, req.channel, newRoom, isBroadcaster);
      if (newRoom || isBroadcaster) {
        hosts[req.room] = {
          id: req.peerId,
          socket: socket
        };

        socket.emit('create', req.channel);
      } else {
        socket.emit('join', req.channel);
      }
    });
  });
};
