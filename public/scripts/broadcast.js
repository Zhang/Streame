'use strict';

(function() {
  var app = angular.module('streamit.broadcast', []);

  app.controller('BroadcastController', function() {
  });

  app.directive('header', function() {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/header.html'
    };
  });

  app.service('preferOpus', function() {
    function extractSdp(sdpLine, pattern) {
      var result = sdpLine.match(pattern);
      return result && result.length === 2 ? result[1] : null;
    }

    // Set the selected codec to the first in m line.
    function setDefaultCodec(mLine, payload) {
      var elements = mLine.split(' ');
      var newLine = [];
      var index = 0;
      for (var i = 0; i < elements.length; i++) {
        if (index === 3) { // Format of media starts from the fourth.
          newLine[index++] = payload; // Put target payload to the first.
        }
        if (elements[i] !== payload) {
          newLine[index++] = elements[i];
        }
      }
      return newLine.join(' ');
    }

    // Strip CN from sdp before CN constraints is ready.
    function removeCN(sdpLines, mLineIndex) {
      var mLineElements = sdpLines[mLineIndex].split(' ');
      // Scan from end for the convenience of removing an item.
      for (var i = sdpLines.length-1; i >= 0; i--) {
        var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload) {
          var cnPos = mLineElements.indexOf(payload);
          if (cnPos !== -1) {
            // Remove CN payload from m line.
            mLineElements.splice(cnPos, 1);
          }
          // Remove CN line in sdp
          sdpLines.splice(i, 1);
        }
      }

      sdpLines[mLineIndex] = mLineElements.join(' ');
      return sdpLines;
    }

    return function preferOpus(sdp) {
      var sdpLines = sdp.split('\r\n');
      var mLineIndex;
      // Search for m line.
      for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].search('m=audio') !== -1) {
            mLineIndex = i;
            break;
          }
      }
      if (mLineIndex === null) {
        return sdp;
      }

      // If Opus is available, set it as the default in m line.
      for (i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('opus/48000') !== -1) {
          var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
          if (opusPayload) {
            sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
          }
          break;
        }
      }

      // Remove CN in m line and sdp.
      sdpLines = removeCN(sdpLines, mLineIndex);

      sdp = sdpLines.join('\r\n');
      return sdp;
    };
  });

  app.directive('viewer', function(PeerConnection, Socket, preferOpus) {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/viewer.html',
      link: function($scope, elem) {
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
            if (pc) {
              pc.addStream(videoStream);
              pc.createOffer(function(sessionDescription) {
                // Set Opus as the preferred codec in SDP if Opus is present.
                sessionDescription.sdp = preferOpus(sessionDescription.sdp);
                pc.setLocalDescription(sessionDescription);
                Socket.emit('message', sessionDescription);
              }, function(err) {
                console.log(err);
              });
            } else {
              $scope.rtcUnavailable = true;
            }
          }
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
