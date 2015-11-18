'use strict';

(function() {
  var module = angular.module('streamit.router', ['ui.router']);
  module.config(function($stateProvider) {
    $stateProvider
      .state('broadcast', {
        url: '/:channel?isCall',
        templateUrl: 'scripts/broadcast.html',
        controller: 'BroadcastController'
      });
  });
})();
