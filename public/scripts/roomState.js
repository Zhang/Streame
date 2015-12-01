'use strict';

(function() {
  var app = angular.module('streamit.roomstate', [
    'btford.socket-io'
  ]);

  app.factory('SocketManager', function(socketFactory, $cookies, $stateParams) {
    function init() {
      var socket = socketFactory({
        ioSocket: io.connect()
      });

      socket.standardEmit = function(evt, data) {
        var standardized = _.merge({
          channel: $stateParams.channel,
          userId: $cookies.get('cookieId')
        }, data || {});
        this.emit(evt, standardized);
      };

      socket.standardEmit('join');
      return socket;
    }

    return {
      init: init
    };
  });
})();
