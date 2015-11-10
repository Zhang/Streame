'use strict';

(function() {
  var module = angular.module('streamit.router', ['ui.router']);
  module.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/broadcast');
    $stateProvider
      .state('broadcast', {
        url: '/',
        templateUrl: 'scripts/broadcast.html',
        controller: 'BroadcastController'
      });
  });
})();
