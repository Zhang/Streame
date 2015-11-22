'use strict';

(function() {
  var app = angular.module('streamit.broadcast', [
    'uuid4',
    'streamit.embeddedViews',
    'ngCookies'
  ]);

  app.controller('ModalInstanceCtrl', function(Type, $scope) {
    $scope.type = Type.text;
    $scope.submit = function(url, title, type) {
      $scope.$close({url: url, title: title, type: type});
    };
    $scope.dismiss = function() {
      $scope.$dismiss();
    };
  });

  app.controller('BroadcastController', function($scope, $rootScope, Socket, $stateParams, uuid4, $cookies, PeerConnection) {
    $scope.MAIN_STREAM_ID = 'video-container';
    $scope.socket = Socket;
    $scope.channel = $stateParams.channel;
    $scope.user = {
      name: 'Caesarofthesky',
      image: 'fonts/scott.jpg'
    };
    function removeStream() {
      $scope.$broadcast('removeStream');
    }

    function attachStream(stream, element, opts) {
      element = element || document.createElement('video');
      opts = _.defaults(opts || {}, {
        autoplay: true,
        muted: false
      });

      if (opts.autoplay) {
        element.autoplay = 'autoplay';
      }

      if (opts.muted) {
        element.muted = true;
      }

      attachMediaStream(element, stream);
      $scope.$broadcast('attachStream', {
        element: element
      });
    }

    $scope.socket.emit('create or join', {
      channel: $stateParams.channel,
      peerId: PeerConnection.id
    });

    $scope.socket.on('create', function(res) {
      if (res.channel !== $stateParams.channel) return;
      $rootScope.isBroadcaster = true;
      navigator.getUserMedia({video: true, audio: true}, function(stream) {
        attachStream(stream, null, {muted: true});

        $scope.socket.on('joined', function(userId) {
            var call = PeerConnection.call(userId, stream);

            if ($stateParams.isCall) {
              call.on('stream', function(remoteStream) {
                attachStream(remoteStream);
              });
            }
        });
        if (res.isReconnection) {
          $scope.socket.emit('reconnected');
        }
      }, function(err) {
        console.log('Failed to get local stream', err);
      });
    });

    $scope.socket.on('join', function(room) {
      if (room !== $stateParams.channel) return;
      $rootScope.isBroadcaster = $stateParams.isCall;
      PeerConnection.on('call', function(call) {
        if ($stateParams.isCall) {
          navigator.getUserMedia({video: true, audio: true}, function(stream) {
            attachStream(stream, null, {muted: true});
            call.answer(stream);
          }, function(err) {
            console.log('Failed to get local stream', err);
          });
        } else {
          call.answer();
        }
        call.on('stream', function(remoteStream) {
          attachStream(remoteStream);
        });
      });
      $scope.socket.emit('add peer', PeerConnection.id);
    });

    $scope.socket.on('reconnected', function(room) {
      if (room !== $stateParams.channel) return;
      removeStream();
      $scope.socket.emit('add peer', PeerConnection.id);
    });
  });

  app.directive('header', function() {
    return {
      replace: true,
      template: '<div class="header"><h2 class="title-text">Stream Me - Under Developement</h2></div>'
    };
  });

  app.directive('footer', function($uibModal) {
    return {
      replace: true,
      templateUrl: 'scripts/footer.html',
      scope: {
        socket: '=',
        connection: '='
      },
      link: function($scope) {
        $scope.add = false;
        $scope.toggleAdd = function() {
          $scope.add = !$scope.add;
        };

        $scope.mediaForms = [];
        var addMedia = function(url, title, thumbnailUrl, toggleEvent) {
          $scope.mediaForms.push({
            url: url,
            type: toggleEvent,
            title: title,
            thumbnailUrl: thumbnailUrl,
            toggle: function() {
              $scope.socket.emit(toggleEvent, {
                on: true,
                src: url || ''
              });
            }
          });
        };

        $scope.remove = function(index) {
          $scope.mediaForms.splice(index, 1);
        };

        $scope.open = function(type, socketEvent) {
          var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'scripts/modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
            scope: $scope,
            resolve: {
              Type: {
                text: type
              }
            }
          });

          modalInstance.result.then(function (res) {
            var url = res.url;
            var thumbnailUrl = url;

            if (socketEvent === 'toggleVideo') {
              var youtubeMatches = url.match(/embed\/(.*)/i) || url.match(/v=(.*?)&/i) || url.match(/v=(.*)/i);
              var queries = url.match(/t=(.*)/) || '';
              var youtubeVideoCode = youtubeMatches[1];
              thumbnailUrl = 'http://img.youtube.com/vi/' + youtubeVideoCode + '/0.jpg';
              url = 'https://www.youtube.com/embed/' + youtubeVideoCode + '?autoplay=1&' + queries[0];
            } else if (socketEvent === 'toggleGif') {
              var type = res.type === 'gif' ? '.webm' : '.jpg';
              var imgurCode = url.match(/gallery\/(.*)/i) || url.match(/\/(.*?).webm/i) || url.match(/\/(.*?).gifv/i) || url.match(/\/(.*?).gif/i) || url.match(/\/(.*?).jpg/i) || (/\/(.*?).png/i);
              url = 'https://i.imgur.com/' + imgurCode[1] + type;
              thumbnailUrl = url;
            }

            addMedia(url, res.title, thumbnailUrl, socketEvent);
          });
        };

        // window.AudioContext = window.AudioContext || window.webkitAudioContext;
        // var context = new AudioContext();
        // var gainNode = context.createGain();
        // gainNode.connect(context.destination);
        // // don't play for self
        // gainNode.gain.value = 0;
        // document.querySelector('input[type=file]').onchange = function() {
        //   this.disabled = true;
        //   var reader = new FileReader();
        //   reader.onload = (function(e) {
        //     // Import callback function that provides PCM audio data decoded as an audio buffer
        //     context.decodeAudioData(e.target.result, function(buffer) {
        //       // Create the sound source
        //       var soundSource = context.createBufferSource();
        //       soundSource.buffer = buffer;
        //       soundSource.start(0, 0 / 1000);
        //       soundSource.connect(gainNode);
        //       var destination = context.createMediaStreamDestination();
        //       soundSource.connect(destination);
        //       destination.stream.streamid = 'audio-only';
        //       $scope.connection.renegotiate(destination.stream, {audio: true, oneway: true});
        //     });
        //   });
        //   reader.readAsArrayBuffer(this.files[0]);
        // };
      }
    };
  });

  app.directive('additionalInfo', function() {
    return {
      scope: {
      },
      templateUrl: 'scripts/additionalInfo.html',
      link: function($scope) {
        $scope.topic = 'National Ave Talks AYTO Season Finale';
      }
    };
  });

  app.directive('viewer', function($rootScope) {
    return {
      scope: {
        socket: '=',
        connection: '='
      },
      replace: true,
      templateUrl: 'scripts/viewer.html',
      link: function($scope) {
        $scope.overlay = false;
        $scope.displayContent = {
          video: true,
          iframe: false,
          image: false,
          imgur: false
        };

        $scope.MAIN_STREAM_ID = 'video-container';

        $scope.toggleDisplay = function(content, socketEvent, toggleOn) {
          if (content === 'cancel' && !$rootScope.isBroadcaster) return;

          _.each($scope.displayContent, function(v, k) {
            $scope.displayContent[k] = false;
          });

          if (toggleOn) {
            $scope.overlay = true;
            $scope.socketEvent = socketEvent;
            $scope.displayContent[content] = true;
          } else {
            $scope.socket.emit($scope.socketEvent, {});
            $scope.socketEvent = '';
            $scope.overlay = false;
            $scope.displayContent.video = true;
          }
        };
      }
    };
  });
})();
