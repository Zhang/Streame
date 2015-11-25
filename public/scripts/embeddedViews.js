'use strict';

(function() {
  var app = angular.module('streamit.embeddedViews', []);

  app.directive('mainStream', function($compile) {
    return {
      replace: true,
      templateUrl: 'scripts/mainStream.html',
      scope: {
        setId: '=',
        socket: '=',
        onToggle: '&'
      },
      link: function($scope, elem) {
        $scope.streams = [];
        $scope.$on('attachStream', function(e, description) {
          var container = $('<div/>', {
            class: 'vid-holder'
          }).append(description.element);
          container.append($compile('<reactions socket="socket"></reactions>')($scope));
          $('#video-container').append(container);
        });
        $scope.$on('removeStream', function() {
          $scope.streams.splice(0, $scope.streams.length - 1);
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

  app.directive('reactions', function($timeout) {
    return {
      scope: {
        socket: '='
      },
      restrict: 'E',
      templateUrl: 'scripts/reactions.html',
      link: function($scope, el) {
        var sendMsg = _.throttle(
          function() {
            var text = $('#react-comment').val();
            $scope.socket.standardEmit('add comment', {text: text});
            $('#react-comment').val('');
          },
          1000,
          { leading: true, trailing: false }
        );

        $('#react-comment').keypress(function(e) {
          if (e.which === 13) {
            e.preventDefault();
            sendMsg();
          }
        });

        $scope.socket.on('comment added', function(msg) {
          var commentContainer = $('<span/>', {
            text: msg.text,
            class: 'comment'
          });
          commentContainer.css('top', Math.floor(Math.random() * 90) + '%');
          commentContainer.css('right', Math.floor(Math.random() * 90) + '%');
          el.append(commentContainer);
          $timeout(function() {
            commentContainer.remove();
          }, 3000);
        });
      }
    };
  });
})();
