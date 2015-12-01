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
  app.directive('ngScrollBottom', ['$timeout', function ($timeout) {
    return {
      scope: {
        ngScrollBottom: '='
      },
      link: function ($scope, el) {
        $scope.$watchCollection('ngScrollBottom', function (newValue) {
          if (newValue) {
            $timeout(function(){
              $(el).scrollTop(el[0].scrollHeight);
            }, 0);
          }
        });
      }
    };
  }]);
  app.factory('$Janus', function() {
    return Janus;
  });
})();
