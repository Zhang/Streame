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

  app.factory('Socket', function(socketFactory) {
    var socket = socketFactory({
      ioSocket: io.connect()
    });

    return socket;
  });

  app.factory('PeerConnection', function($cookies) {
    var config = {
      path: '/peerjs',
      host: $cookies.get('host'),
    };
    if ($cookies.get('host') === 'localhost') {
      config.port = 8080;
    }
    return new Peer($cookies.get('cookieId'), config);
  });
})();
