'use strict';

(function() {
  var app = angular.module('streamit.broadcast', []);

  app.controller('BroadcastController', function(Socket) {
    Socket.on('event', function() {
      console.log('wtf1');
    });
  });

  app.directive('header', function() {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/header.html'
    };
  });
})();
