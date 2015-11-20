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
        $scope.$on('attachStream', function(e, description) {
          elem.append(description.element);
        });
        $scope.$on('removeStream', function() {
          elem.empty();
        });
        elem.attr('id', $scope.setId);
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

  app.directive('gifvFrame', function() {
    return {
      replace: true,
      templateUrl: 'scripts/gifv.html',
      scope: {
        setId: '=',
        socket: '=',
        onToggle: '&'
      },
      link: function($scope, elem) {
        elem.attr('id', $scope.setId);
        $scope.FRAME_ID = 'frame-gif';
        $scope.IMG_ID = 'image-id';
        $scope.socket.on('toggleGif', function(gif) {
          $scope.onToggle({toggleOn: gif.on});
          $('#' + $scope.FRAME_ID).empty();
          if (gif.on) {
            $scope.isGif = gif.src.match(/.webm/);
            if ($scope.isGif) {
              var src = document.createElement('source');
              src.src = gif.src;
              src.type = 'video/webm';
              $('#' + $scope.FRAME_ID).append(src);
            } else {
              $('#' + $scope.IMG_ID).attr('src', gif.src);
            }
          }
        });
      }
    };
  });
})();
