'use strict';

var _ = require('lodash');

module.exports = function(app) {
  var io = require('socket.io')(app);

  //need to ensure sockets can only be in one room at a time
  io.on('connection', function(socket) {
    // All socket messages contain :
    // { channel: String, userId: String }
    socket.on('toggleVideo', function(msg) {
      io.sockets.in(msg.channel).emit('toggleVideo', msg);
    });
    socket.on('add comment', function(msg) {
      io.sockets.in(msg.channel).emit('comment added', msg);
    });
    socket.on('toggleGif', function(msg) {
      io.sockets.in(msg.channel).emit('toggleGif', msg);
    });
    socket.on('toggleImage', function(msg) {
      io.sockets.in(msg.channel).emit('toggleImage', msg);
    });
    socket.on('remove stream', function(msg) {
      io.sockets.in(msg.channel).emit('remove stream', msg);
    });
    socket.on('chat-sent', function(msg) {
      io.sockets.in(msg.channel).emit('chat-received', msg);
    });
    socket.on('join', function(msg) {
      socket.join(msg.channel);
    });
  });
};
