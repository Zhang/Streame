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
    $state.go('broadcast');
  });

  app.factory('Socket', function (socketFactory) {
    var socket = socketFactory({
      ioSocket: io.connect()
    });

    return socket;
  });
})();
