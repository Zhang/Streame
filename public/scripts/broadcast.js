'use strict';

(function() {
  var app = angular.module('streamit.broadcast', []);

  app.controller('BroadcastController', function(Socket) {
  });

  app.directive('header', function() {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/header.html'
    };
  });

  app.directive('viewer', function(PeerConnection) {
    return {
      scope: '=',
      replace: true,
      templateUrl: 'scripts/viewer.html',
      link: function($scope, elem) {
        $scope.rtcUnavailable = false;
        var video = $('#video');

        function handleUserMedia(stream) {
          video.attr('src', window.URL.createObjectURL(stream));
          var videoStream = stream;
          // if (!_.isUndefined(video)) {
          //   var pc = PeerConnection(video);
          //   if (pc) {
          //     pc.addStream(videoStream);
          //     isStarted = true;

          //     // if (isInitiator) {
          //     //   pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
          //     // }
          //   } else {
          //     $scope.rtcUnavailable = true;
          //   }
          // }
        }

        function handleUserMediaError(error){
          console.log('getUserMedia error: ', error);
        }

        var constraints = {video: true, audio: true};
        getUserMedia(constraints, handleUserMedia, handleUserMediaError);
      }
    };
  });

  app.factory('PeerConnection', function(socketFactory) {
    function handleIceCandidate(event) {
      console.log('handleIceCandidate event: ', event);

      if (event.candidate) {
        socketFactory.emit('message', {
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
        videoElement.src = window.URL.createObjectURL(event.stream);
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
