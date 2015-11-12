'use strict';

(function() {
  var app = angular.module('streamit.broadcast', [
    'streamit.preferOpus',
    'streamit.embeddedViews'
  ]);

  app.controller('BroadcastController', function($scope, socketFactory, $stateParams, $timeout) {
    $scope.MAIN_STREAM_ID = 'video-container';
    $scope.socket = socketFactory({
      ioSocket: io.connect()
    });

    var MODERATOR_CHANNEL_ID = $stateParams.channel;
    var MODERATOR_SESSION_ID = 'XYZ';
    var MODERATOR_ID = 'JKL';
    var MODERATOR_SESSION = {
      audio: true,
      video: true
    };
    var MODERATOR_EXTRA = {};

    $scope.connection = new RTCMultiConnection(MODERATOR_CHANNEL_ID);
    $timeout(function() {
      $scope.connection.body = $('#' + $scope.MAIN_STREAM_ID).get(0);

      $scope.socket.emit('create or join', $stateParams.channel);
      $scope.socket.on('create', function() {
        $scope.connection.session = MODERATOR_SESSION;
        $scope.connection.userid = MODERATOR_ID;
        $scope.connection.extra = MODERATOR_EXTRA;
        $scope.connection.open({
          dontTransmit: true,
          sessionid: MODERATOR_SESSION_ID,
          oneway: true
        });
      });

      $scope.socket.on('join', function() {
        $scope.connection.join({
          sessionid: MODERATOR_SESSION_ID,
          userid: MODERATOR_ID,
          extra: MODERATOR_EXTRA,
          session: {
            audio: false,
            video: false
          }
        });
      });
    }, 1000);
  });

  app.directive('header', function() {
    return {
      replace: true,
      template: '<div class="header"><h2 class="title-text">StreamIt</h2></div>'
    };
  });

  app.directive('footer', function() {
    return {
      replace: true,
      templateUrl: 'scripts/footer.html',
      scope: {
        socket: '=',
        connection: '='
      },
      link: function($scope) {
        $scope.socket.on('remove stream', function(stream) {
          $scope.connection.removeStream('scott');
        });

        $scope.stopStream = function() {
          $scope.socket.emit('remove stream', 'scott');
        };

        $scope.toggleVideo = function(src) {
          $scope.socket.emit('toggleVideo', {
            on: $scope.displayContent.video,
            src: src || ''
          });
        };

        $scope.toggleImage = function(src) {
          $scope.toggleDisplay('image', !$scope.displayContent.image);
          $scope.socket.emit('toggleImage', {
            on: $scope.displayContent.image,
            src: src || ''
          });
        };

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var context = new AudioContext();
        var gainNode = context.createGain();
        gainNode.connect(context.destination);
        // don't play for self
        gainNode.gain.value = 0;
        document.querySelector('input[type=file]').onchange = function() {
          this.disabled = true;
          var reader = new FileReader();
          reader.onload = (function(e) {
            // Import callback function that provides PCM audio data decoded as an audio buffer
            context.decodeAudioData(e.target.result, function(buffer) {
              // Create the sound source
              var soundSource = context.createBufferSource();
              soundSource.buffer = buffer;
              soundSource.start(0, 0 / 1000);
              soundSource.connect(gainNode);
              var destination = context.createMediaStreamDestination();
              soundSource.connect(destination);
              destination.stream.streamid = 'audio-only';
              $scope.connection.renegotiate(destination.stream, {audio: true, oneway: true});
            });
          });
          reader.readAsArrayBuffer(this.files[0]);
        };
      }
    };
  });

  app.directive('viewer', function() { //PeerConnection, Socket, preferOpus) {
    return {
      scope: {
        socket: '=',
        connection: '='
      },
      replace: true,
      templateUrl: 'scripts/viewer.html',
      link: function($scope) {
        $scope.displayContent = {
          video: true,
          iframe: false,
          image: false,
        };
        $scope.MAIN_STREAM_ID = 'video-container';

        $scope.toggleDisplay = function(content, toggleOn) {
          _.each($scope.displayContent, function(v, k) {
            $scope.displayContent[k] = false;
          });
          if (toggleOn) {
            $scope.displayContent[content] = true;
          } else {
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


  app.factory('PeerConnection', function(Socket) {
    function handleIceCandidate(event) {
      console.log('handleIceCandidate event: ', event);

      if (event.candidate) {
        Socket.emit('message', {
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('End of candidates.');
      }
    }


    function handleRemoteStreamAdded(videoElement) {
      return function(event) {
        videoElement.attr('src', window.URL.createObjectURL(event.stream));
      };
    }


    function handleRemoteStreamRemoved(event) {
      console.log('Remote stream removed. Event: ', event);
    }

    return function(videoElement) {
      var peerConnection;
      try {
        peerConnection = new RTCPeerConnection(null);
        peerConnection.onicecandidate = handleIceCandidate;
        peerConnection.onaddstream = handleRemoteStreamAdded(videoElement);
        peerConnection.onremovestream = handleRemoteStreamRemoved;
      } catch (e) {
        console.log('unable to create peer connection: ', e);
      }
      return peerConnection;
    };
  });
})();
