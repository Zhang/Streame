'use strict';

(function() {
  var module = angular.module('streamit.router', ['ui.router']);
  module.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('broadcast', {
        url: '/:channel',
        templateUrl: 'scripts/broadcast.html',
        controller: 'BroadcastController'
      });
  });
})();
