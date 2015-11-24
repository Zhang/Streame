'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);
  var hosts = {};
  //socket incoming message format
  // {}
  io.on('connection', function(socket) {
    //need to ensure sockets can only be in one room at a time
    socket.on('create or join', function(req) {
      socket.on('add peer', function(peerId) {
        hosts[req.channel].socket.emit('joined', peerId);
      });
      socket.on('toggleVideo', function(vid) {
        var nsp = io.of(req.channel);
        nsp.emit('toggleVideo', vid);
      });
      socket.on('toggleGif', function(gif) {
        var nsp = io.of(req.channel);
        nsp.emit('toggleGif', gif);
      });
      socket.on('toggleImage', function(img) {
        var nsp = io.of(req.channel);
        nsp.emit('toggleImage', img);
      });
      socket.on('reconnected', function() {
        socket.broadcast.emit('reconnected', req.channel);
      });
      socket.on('remove stream', function(stream) {
        var nsp = io.of(req.channel);
        nsp.emit('remove stream', stream);
      });
      socket.on('chat-sent', function(chat) {
        socket.emit('chat-received', chat);
      });
      var ONE_USER = 1;
      socket.join(req.channel);
      var newRoom = _.keys(io.nsps['/'].adapter.rooms[req.channel]).length === ONE_USER;
      var isBroadcaster = _.get(hosts[req.channel], 'id') === req.peerId;

      if (newRoom || isBroadcaster) {
        hosts[req.channel] = {
          id: req.peerId,
          socket: socket
        };

        socket.emit('create', {
          channel: req.channel,
          isReconnection: isBroadcaster
        });
      } else {
        socket.emit('join', req.channel);
      }
    });
  });
};
