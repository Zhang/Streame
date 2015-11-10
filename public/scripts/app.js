'use strict';

(function() {
  var app = angular.module('streamit', [
    'btford.socket-io',
    'ui.router',
    'streamit.router',
    'streamit.broadcast'
  ]);

  app.run(function($state) {
    $state.go('broadcast');
  });

  app.factory('Socket', function (socketFactory) {
    return socketFactory({
      ioSocket: io.connect('http://localhost:8080')
    });
  });
})();
