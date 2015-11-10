'use strict';

(function() {
  var app = angular.module('streamit', [
    'ui.router',
    'streamit.router',
    'streamit.broadcast'
  ]);

  app.run(function($state) {
    $state.go('broadcast');
  });
})();
