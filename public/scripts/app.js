'use strict';

(function() {
  var app = angular.module('streamit', [
    'btford.socket-io',
    'ui.router',
    'ui.bootstrap',
    'streamit.router',
    'streamit.broadcast'
  ]);

  app.run(function($state) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    $state.go('broadcast');
  });
  app.directive('ngScrollBottom', ['$timeout', function ($timeout) {
    return {
      scope: {
        ngScrollBottom: '='
      },
      link: function ($scope, el) {
        $scope.$watchCollection('ngScrollBottom', function (newValue) {
          if (newValue) {
            $timeout(function(){
              $(el).scrollTop(el[0].scrollHeight);
            }, 0);
          }
        });
      }
    };
  }]);
  app.factory('SocketManager', function(socketFactory) {
    var socket = socketFactory({
      ioSocket: io.connect()
    });

    var createdEvents = {
      create: {},
      join: {},
      joined: {},
      reconnected: {}
    };

    function eventCreator(evnt) {
      return function (channel, fn) {
        if (createdEvents[evnt][channel]) return;
        createdEvents.create[channel] = true;
        socket.on(evnt, function(data) {
          if (data.channel !== channel) return;
          fn(data);
        });
      };
    }
    return {
      socket: socket,
      onCreate: eventCreator('create'),
      onJoined: eventCreator('joined'),
      onJoin: eventCreator('join')
    };
  });

  app.factory('PeerConnectionManager', function($cookies) {
    var alreadyJoined = {};

    var config = {
      path: '/peerjs',
      host: $cookies.get('host'),
    };
    if ($cookies.get('host') === 'localhost') {
      config.port = 9000;
    }
    var connection = new Peer($cookies.get('cookieId'), config);

    return {
      connection: connection,
      addOnCall: function(channel, fn) {
        if (alreadyJoined[channel]) return;
        alreadyJoined[channel] = true;
        connection.on('call', fn);
      }
    };
  });
})();
