'use strict';

(function() {
  var app = angular.module('streamit.broadcast', [
    'streamit.preferOpus'
  ]);

  app.controller('BroadcastController', function() {});

  app.directive('header', function() {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/header.html'
    };
  });

  app.directive('viewer', function(socketFactory, $stateParams) { //PeerConnection, Socket, preferOpus) {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/viewer.html',
      link: function($scope) {
        var Socket = socketFactory({
          ioSocket: io.connect()
        });
        Socket.emit('create or join', $stateParams.channel);

        var MODERATOR_CHANNEL_ID = $stateParams.channel;
        var MODERATOR_SESSION_ID = 'XYZ';
        var MODERATOR_ID = 'JKL';
        var MODERATOR_SESSION = {
          audio: true,
          video: true
        };
        var MODERATOR_EXTRA = {};

        function createConnection(channelId) {
          var connection = new RTCMultiConnection(channelId);
          connection.body = $('#video-container').get(0);
          return connection;
        }

        Socket.on('create', function() {
          var connection = createConnection(MODERATOR_CHANNEL_ID);
          connection.session = MODERATOR_SESSION;
          connection.userid = MODERATOR_ID;
          connection.extra = MODERATOR_EXTRA;
          connection.open({
            dontTransmit: true,
            sessionid: MODERATOR_SESSION_ID,
            oneway: true
          });
        });

        Socket.on('join', function() {
          var connection = createConnection(MODERATOR_CHANNEL_ID);

          connection.join({
            sessionid: MODERATOR_SESSION_ID,
            userid: MODERATOR_ID,
            extra: MODERATOR_EXTRA,
            session: {
              audio: false,
              video: false
            }
          });
        });

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
