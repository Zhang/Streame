'use strict';

(function() {
  var module = angular.module('streamit.router', ['ui.router']);
  module.config(function($stateProvider) {
    $stateProvider
      .state('broadcast', {
        url: '/:channel?isCall',
        templateUrl: 'scripts/broadcast.html',
        controller: 'BroadcastController',
        resolve: {
          initedJanus: function($Janus, $q) {
            var deferred = $q.defer();
            $Janus.init({
              debug: false,
              callback: function() {
                var janus = new $Janus({
                  server: 'http://54.183.102.227:8088/janus',
                  success: function() {
                    deferred.resolve(janus);
                  },
                  error: function() {
                    deferred.reject('failed to initialize janus');
                  }
                });
              }
            });
            return deferred.promise;
          }
        }
      });
  });
})();
