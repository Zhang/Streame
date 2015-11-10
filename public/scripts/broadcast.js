'use strict';

(function() {
  var app = angular.module('streamit.broadcast', []);

  app.controller('BroadcastController', function($state) {
    console.log($state);
  });
})();
