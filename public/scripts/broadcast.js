'use strict';

(function() {
  var app = angular.module('streamit.broadcast', []);

  app.controller('BroadcastController', function() {
  });

  app.directive('header', function() {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/header.html'
    };
  });
})();
