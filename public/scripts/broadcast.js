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

  // app.directive('viewer', function(preferOpus) {
  //   return {
  //     scope: '=',
  //     replace: true,
  //     templateUrl: 'scripts/viewer.html',
  //     link: function() {
  //       var isChannelReady;
  //       var isCreator = false;
  //       var isStarted = false;
  //       var localStream;
  //       var pc;
  //       var remoteStream;
  //       var turnReady;

  //       // Set up audio and video regardless of what devices are present.
  //       var sdpConstraints = {
  //         mandatory: {
  //           OfferToReceiveAudio: true,
  //           OfferToReceiveVideo: true
  //         }
  //       };

  //       var socket = io.connect();
  //       socket.emit('create or join', '/');

  //       socket.on('created', function (room){
  //         isCreator = true;
  //       });

  //       socket.on('join', function (room){
  //         isChannelReady = true;
  //       });

  //       socket.on('joined', function (room){
  //         isChannelReady = true;
  //       });

  //       function sendMessage(message){
  //         socket.emit('message', message);
  //       }

  //       socket.on('message', function (message){
  //         if (message === 'got user media') {
  //           maybeStart();
  //         } else if (message.type === 'offer') {
  //           if (!isCreator && !isStarted) {
  //             maybeStart();
  //           }
  //           pc.setRemoteDescription(new RTCSessionDescription(message));
  //           doAnswer();
  //         } else if (message.type === 'answer' && isStarted) {
  //           pc.setRemoteDescription(new RTCSessionDescription(message));
  //         } else if (message.type === 'candidate' && isStarted) {
  //           var candidate = new RTCIceCandidate({
  //             sdpMLineIndex: message.label,
  //             candidate: message.candidate
  //           });
  //           pc.addIceCandidate(candidate);
  //         } else if (message === 'bye' && isStarted) {
  //           handleRemoteHangup();
  //         }
  //       });

  //       var localVideo = $('#localVideo');
  //       var remoteVideo = $('#remoteVideo');

  //       function handleUserMedia(stream) {
  //         localVideo.attr('src', window.URL.createObjectURL(stream));
  //         localStream = stream;
  //         maybeStart();
  //         sendMessage('got user media');
  //       }

  //       function handleUserMediaError(error){
  //         console.log('getUserMedia error: ', error);
  //       }

  //       var constraints = {video: true};
  //       getUserMedia(constraints, handleUserMedia, handleUserMediaError);

  //       function maybeStart() {
  //         if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
  //           createPeerConnection();
  //           pc.addStream(localStream);
  //           isStarted = true;
  //           console.log('isCreator', isCreator);
  //           if (isCreator) {
  //             doCall();
  //           }
  //         }
  //       }

  //       function createPeerConnection() {
  //         try {
  //           pc = new RTCPeerConnection(null);
  //           pc.onicecandidate = handleIceCandidate;
  //           pc.onaddstream = handleRemoteStreamAdded;
  //           pc.onremovestream = handleRemoteStreamRemoved;
  //           console.log('Created RTCPeerConnnection');
  //         } catch (e) {
  //           console.log('Failed to create PeerConnection, exception: ' + e.message);
  //           console.log('Cannot create RTCPeerConnection object.');
  //             return;
  //         }
  //       }

  //       function handleIceCandidate(event) {
  //         console.log('handleIceCandidate event: ', event);
  //         if (event.candidate) {
  //           sendMessage({
  //             type: 'candidate',
  //             label: event.candidate.sdpMLineIndex,
  //             id: event.candidate.sdpMid,
  //             candidate: event.candidate.candidate});
  //         } else {
  //           console.log('End of candidates.');
  //         }
  //       }

  //       function handleRemoteStreamAdded(event) {
  //         console.log('Remote stream added.');
  //         remoteVideo.attr('src', window.URL.createObjectURL(event.stream));
  //       }

  //       function handleCreateOfferError(e){
  //         console.log('createOffer() error: ', e);
  //       }

  //       function doCall() {
  //         console.log('Sending offer to peer');
  //         pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
  //       }

  //       function doAnswer() {
  //         console.log('Sending answer to peer.');
  //         pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
  //       }

  //       function setLocalAndSendMessage(sessionDescription) {
  //         // Set Opus as the preferred codec in SDP if Opus is present.
  //         sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  //         pc.setLocalDescription(sessionDescription);
  //         console.log('setLocalAndSendMessage sending message' , sessionDescription);
  //         sendMessage(sessionDescription);
  //       }

  //       function handleRemoteStreamRemoved(event) {
  //         console.log('Remote stream removed. Event: ', event);
  //       }

  //       function handleRemoteHangup() {}

  //     }
  //   };
  // });

  app.directive('viewer', function(PeerConnection, Socket, preferOpus) {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/viewer.html',
      link: function($scope) {
        var sdpConstraints = {
          mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
          }
        };
        $scope.rtcUnavailable = false;
        var video = $('#video');
        var isCreator;

        (function initiateConnection() {
          Socket.emit('create or join', '/onlyroom');
          Socket.on('created', function() {
            isCreator = true;
            var constraints = {video: true, audio: true};
            getUserMedia(constraints, handleUserMedia, handleUserMediaError);
          });
          Socket.on('joined', function() {
            isCreator = false;
            var constraints = {video: true, audio: true};
            getUserMedia(constraints, handleUserMedia, handleUserMediaError);
          });
        })();

        function handleUserMedia(stream) {
          var videoStream = stream;
          if (isCreator) {
            video.attr('src', window.URL.createObjectURL(stream));
          }
          if (!_.isUndefined(video)) {
            var pc = PeerConnection(video);
            if (pc && isCreator) {
              pc.addStream(videoStream);
              Socket.on('message', function(message) {
                if (message === 'need offer') {
                  pc.createOffer(setLocalAndSendMessage(Socket, pc), function() {});
                } else if (message.type === 'answer') {
                  pc.setRemoteDescription(new RTCSessionDescription(message));
                }
              });
              pc.createOffer(function(sessionDescription) {
                sessionDescription.sdp = preferOpus(sessionDescription.sdp);
                pc.setLocalDescription(sessionDescription);
                Socket.emit('message', sessionDescription);
              }, function(err) {
                console.log(err);
              });
            } else if (pc) {
              Socket.on('message', function(message) {
                if (message.type === 'offer') {
                  pc.setRemoteDescription(new RTCSessionDescription(message));
                  pc.createAnswer(setLocalAndSendMessage(Socket, pc), null, sdpConstraints);
                }
              });
              Socket.emit('message', 'need offer');
            } else {
              $scope.rtcUnavailable = true;
            }
          }
        }
        function setLocalAndSendMessage(socket, pc) {
          return function(sessionDescription) {
            // Set Opus as the preferred codec in SDP if Opus is present.
            sessionDescription.sdp = preferOpus(sessionDescription.sdp);
            pc.setLocalDescription(sessionDescription);
            socket.emit('message', sessionDescription);
          };
        }

        function handleUserMediaError(error){
          console.log('getUserMedia error: ', error);
        }
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
