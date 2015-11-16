'use strict';

(function() {
  var app = angular.module('streamit.broadcast', [
    'uuid4',
    'streamit.embeddedViews',
    'ngCookies'
  ]);
  app.controller('ModalInstanceCtrl', function(Type, $scope) {
    $scope.type = Type.text;
    $scope.submit = function(url) {
      $scope.$close(url);
    };
    $scope.dismiss = function() {
      $scope.$dismiss();
    };
  });
  app.controller('BroadcastController', function($scope, Socket, $stateParams, uuid4, $cookies, PeerConnection) {
    $scope.MAIN_STREAM_ID = 'video-container';
    $scope.socket = Socket;

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
      navigator.getUserMedia({video: true, audio: true}, function(stream) {
        var streamSave = stream;
        attachStream(stream, null, {muted: true});
        $scope.socket.on('joined', function(userId) {
          PeerConnection.call(userId, streamSave);
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
      PeerConnection.on('call', function(call) {
        call.answer();
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
      template: '<div class="header"><h2 class="title-text">Stream Me</h2></div>'
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
        var addMedia = function(url, toggleEvent) {
          $scope.mediaForms.push({
            url: url,
            type: toggleEvent,
            toggle: function() {
              $scope.socket.emit(toggleEvent, {
                on: true,
                src: url || ''
              });
            }
          });
        };

        $scope.open = function (type, socketEvent) {
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

          modalInstance.result.then(function (url) {
            addMedia(url, socketEvent);
          });
        };
        $scope.socket.on('remove stream', function(stream) {
          $scope.connection.removeStream('scott');
        });

        $scope.stopStream = function() {
          $scope.socket.emit('remove stream', 'scott');
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

  app.directive('viewer', function() {
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

        $scope.toggleDisplay = function(content, toggleOn) {
          _.each($scope.displayContent, function(v, k) {
            $scope.displayContent[k] = false;
          });
          if (toggleOn) {
            $scope.overlay = true;
            $scope.overlaySignal = content === 'iframe' ? 'toggleVideo' :'toggleImage';
            $scope.displayContent[content] = true;
          } else {
            $scope.socket.emit($scope.overlaySignal, {});
            $scope.overlaySignal = '';
            $scope.overlay = false;
            $scope.displayContent.video = true;
          }
        };

      //   var sdpConstraints = {
      //     mandatory: {
      //       OfferToReceiveAudio: true,
      //       OfferToReceiveVideo: true
      //     }
      //   };
      //   $scope.rtcUnavailable = false;
      //   var video = $('#video');
      //   var isCreator;

      //   (function initiateConnection() {
      //     Socket.emit('create or join', '/');
      //     Socket.on('created', function() {
      //       isCreator = true;
      //       var constraints = {video: true, audio: true};
      //       getUserMedia(constraints, handleUserMedia, handleUserMediaError);
      //     });
      //     Socket.on('joined', function() {
      //       isCreator = false;
      //       handleUserMedia();
      //     });
      //   })();

      //   function handleUserMedia(stream) {
      //     var videoStream = stream;
      //     if (isCreator) {
      //       video.attr('src', window.URL.createObjectURL(stream));
      //     }
      //     if (!_.isUndefined(video)) {
      //       var pc = PeerConnection(video);
      //       if (pc && isCreator) {
      //         pc.addStream(videoStream);
      //         Socket.on('message', function(message) {
      //           if (message === 'need offer') {
      //             pc.createOffer(setLocalAndSendMessage(Socket, pc), function() {});
      //           } else if (message.type === 'answer') {
      //             pc.setRemoteDescription(new RTCSessionDescription(message));
      //           }
      //         });
      //         pc.createOffer(function(sessionDescription) {
      //           sessionDescription.sdp = preferOpus(sessionDescription.sdp);
      //           pc.setLocalDescription(sessionDescription);
      //           Socket.emit('message', sessionDescription);
      //         }, function(err) {
      //           console.log(err);
      //         });
      //       } else if (pc) {
      //         Socket.on('message', function(message) {
      //           if (message.type === 'offer') {
      //             pc.setRemoteDescription(new RTCSessionDescription(message));
      //             pc.createAnswer(setLocalAndSendMessage(Socket, pc), null, sdpConstraints);
      //           }
      //         });
      //         Socket.emit('message', 'need offer');
      //       } else {
      //         $scope.rtcUnavailable = true;
      //       }
      //     }
      //   }
      //   function setLocalAndSendMessage(socket, pc) {
      //     return function(sessionDescription) {
      //       // Set Opus as the preferred codec in SDP if Opus is present.
      //       sessionDescription.sdp = preferOpus(sessionDescription.sdp);
      //       pc.setLocalDescription(sessionDescription);
      //       socket.emit('message', sessionDescription);
      //     };
      //   }

      //   function handleUserMediaError(error){
      //     console.log('getUserMedia error: ', error);
      //   }
      }
    };
  });
})();
