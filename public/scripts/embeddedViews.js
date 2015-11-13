'use strict';

(function() {
  var app = angular.module('streamit.embeddedViews', []);

  app.directive('mainStream', function() {
    return {
      replace: true,
      templateUrl: 'scripts/mainStream.html',
      scope: {
        setId: '=',
        socket: '=',
        onToggle: '&'
      },
      link: function($scope, elem) {
        elem.attr('id', $scope.setId);
        // $scope.onToggle({
        //   toggleOn: true
        // });
      }
    };
  });

  app.directive('videoFrame', function() {
    return {
      replace: true,
      templateUrl: 'scripts/videoFrame.html',
      scope: {
        setId: '=',
        socket: '=',
        onToggle: '&'
      },
      link: function($scope, elem) {
        elem.attr('id', $scope.setId);

        $scope.FRAME_ID = 'frame-video';
        $scope.socket.on('toggleVideo', function(video) {
          $scope.onToggle({toggleOn: video.on});
          $('#' + $scope.FRAME_ID).attr('src', video.src || '');
        });
      }
    };
  });

  app.directive('imageFrame', function() {
    return {
      replace: true,
      templateUrl: 'scripts/imageFrame.html',
      scope: {
        setId: '=',
        socket: '=',
        onToggle: '&'
      },
      link: function($scope, elem) {
        elem.attr('id', $scope.setId);

        $scope.FRAME_ID = 'frame-image';
        $scope.socket.on('toggleImage', function(img) {
          $scope.onToggle({toggleOn: img.on});
          $('#' + $scope.FRAME_ID).attr('src', img.src || '');
        });
      }
    };
  });
})();
