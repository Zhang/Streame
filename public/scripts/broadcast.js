'use strict';

(function() {
  var app = angular.module('streamit.broadcast', [
    'uuid4',
    'streamit.embeddedViews',
    'ngCookies',
    'uuid4',
    'streamit.roomstate'
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
  app.service('JanusManager', function($stateParams, $cookies) {
    var bandwidth = 1024 * 1024;
    function logError(err) {
      console.log(err);
    }

    return function(janus) {
      var plugins = [];
      var videoroom;
      function addRemoteFeeds(publishers) {
        if (publishers) {
          _.each(publishers, function(pub) {
            newRemoteFeed(pub.id);
          });
        }
      }
      var manager = {
        janus: janus,
        detachAllPlugins: function() {
          _.each(plugins, function(p) {
            p.plugin.detach();
          });
        },
        stopRecording: function() {
          _.each(plugins, function(p) {
            if (p.type === 'recording') return p.plugin.detach();
          });
        },
        onStream: function() {
          console.log('on stream not implemented');
        }
      };
      function newRemoteFeed(id) {
        var remoteFeed;
        janus.attach({
          plugin: 'janus.plugin.videoroom',
          success: function(pluginHandle) {
            remoteFeed = pluginHandle;
            plugins.push({
              plugin: pluginHandle,
              type: 'remoteFeed'
            });
            var listen = {
              request: 'join',
              room: parseInt($stateParams.channel),
              ptype: 'listener',
              feed: id
            };
            remoteFeed.send({message: listen});
          },
          error: logError,
          onmessage: function(msg, jsep) {
            var evt = msg.videoroom;
            if(evt) {
              if(evt === 'attached') {
              } else if (msg.error) {
                console.log(msg.error);
              } else {
                console.log('unknown message', msg);
              }
            }
            if(jsep) {
              remoteFeed.createAnswer({
                jsep: jsep,
                media: { audioSend: false, videoSend: false },  // We want recvonly audio/video
                success: function(jsep) {
                  var body = {
                    request: 'start',
                    room: 1234
                  };
                  remoteFeed.send({
                    message: body,
                    jsep: jsep
                  });
                },
                error: logError
              });
            }
          },
          onremotestream: function(stream) {
            manager.onStream(stream, null, {id: id});
          }
        });
      }
      manager.recordFeed = function recordFeed() {
        var recordplay;
        janus.attach({
          plugin: 'janus.plugin.recordplay',
          success: function(pluginHandle) {
            recordplay = pluginHandle;
            plugins.push({
              plugin: pluginHandle,
              type: 'recording'
            });

            recordplay.send({
              message: {
                request: 'configure',
                'video-bitrate-max': bandwidth, // a quarter megabit
                'video-keyframe-interval': 15000 // 15 seconds
              }
            });

            recordplay.createOffer({
              success: function(jsep) {
                var body = {
                  request: 'record',
                  name: 'scort'
                };

                recordplay.send({
                  message: body,
                  jsep: jsep
                });
              },
              error: logError
            });
          },
          onmessage: function(msg, jsep) {
            var result = msg.result;
            var status = _.get(msg, 'result.status');
            if (status) {
              if (status === 'preparing') {
                recordplay.createAnswer({
                  jsep: jsep,
                  media: { audioSend: false, videoSend: false },
                  success: function(jsep) {
                    var body = {request: 'start'};
                    recordplay.send({
                      message: body,
                      jsep: jsep
                    });
                  }
                });
              } else if (status === 'recording') {
                if (jsep) {
                  recordplay.handleRemoteJsep({jsep: jsep});
                }
              } else if (status === 'slow_link') {
                var uplink = result.uplink;
                if(uplink !== 0) {
                  // Janus detected issues when receiving our media, let's slow down
                  bandwidth = parseInt(bandwidth / 1.5);
                  recordplay.send({
                    message: {
                      request: 'configure',
                      'video-bitrate-max': bandwidth, // Reduce the bitrate
                      'video-keyframe-interval': 15000 // Keep the 15 seconds key frame interval
                    }
                  });
                }
              } else if(status === 'playing') {
                console.log('playing');
              } else if (event === 'stopped') {
                console.log('stopped playing: ', result.id);
                recordplay.hangup();
              }
            }
          },
          error: logError
        });
      };
      manager.startVideoRoom = function startVideoRoom() {
        janus.attach({
          plugin: 'janus.plugin.videoroom',
          success: function(pluginHandle) {
            videoroom = pluginHandle;
            plugins.push({
              plugin: pluginHandle,
              type: 'videoroom'
            });

            (function createRoom() {
              var create = {
                request: 'create',
                room: parseInt($stateParams.channel),
                ptype: 'publisher'
              };
              videoroom.send({'message': create});
            })();
            (function registerUsername() {
              var register = {
                request: 'join',
                room: parseInt($stateParams.channel),
                ptype: 'publisher',
                display: $cookies.get('cookieId')
              };
              videoroom.send({'message': register});
            })();
          },
          onmessage: function(msg, jsep) {
            var evt = msg.videoroom;
            if (evt === 'joined') {
              if ($stateParams.isCall) {
                (function publishOwnFeed() {
                  videoroom.createOffer({
                    media: { audioRecv: false, videoRecv: false, audioSend: true, videoSend: true},
                    success: function(jsep) {
                      var publish = {
                        request: 'configure',
                        audio: true,
                        video: true
                      };
                      videoroom.send({message: publish, jsep: jsep});
                    },
                    error: logError
                  });
                })();
              }
              addRemoteFeeds(msg.publishers);
            } else if (evt === 'event') {
              addRemoteFeeds(msg.publishers);
            }
            if (jsep) {
              videoroom.handleRemoteJsep({jsep: jsep});
            }
            if (msg.leaving) {
              $('#' + msg.leaving).remove();
            }
          },
          onlocalstream: function(stream) {
            manager.onStream(stream, null, {muted: true});
          }
        });
      };
      manager.viewRecording = function(id) {
        var recordplay;
        janus.attach({
          plugin: 'janus.plugin.recordplay',
          success: function(pluginHandle) {
            recordplay = pluginHandle;
            var play = {request: 'play', id: id};
            recordplay.send({message: play});
          },
          onremotestream: function(stream) {
            manager.onStream(stream);
          },
          onmessage: function(msg, jsep) {
            var status = _.get(msg, 'result.status');
            if(status === 'preparing') {
              recordplay.createAnswer({
                jsep: jsep,
                media: { audioSend: false, videoSend: false },  // We want recvonly audio/video
                success: function(jsep) {
                  var body = {request: 'start'};
                  recordplay.send({
                    message: body,
                    jsep: jsep
                  });
                },
                error: logError
              });
            }
          },
          error: logError
        });
      };

      return manager;
    };
  });

  app.controller('BroadcastController', function($scope, $rootScope, $stateParams, uuid4, $cookies, SocketManager, $Janus, $q, initedJanus, JanusManager) {
    $rootScope.isBroadcaster = $stateParams.isCall;
    var config = {
      path: '/peerjs',
      host: $cookies.get('host'),
    };
    if ($cookies.get('host') === 'localhost') {
      config.port = 9000;
    }
    $scope.$on('view', function(e, id) {
      $scope.viewing = true;
      removeStreams();
      $scope.janusManager.detachAllPlugins();
      $scope.janusManager.viewRecording(id);
    });

    $scope.recordStream = function() {
      $scope.recording = true;
      $scope.janusManager.recordFeed();
    };
    $scope.stopRecording = function() {
      $scope.recording = false;
      $scope.janusManager.stopRecording();
    };
    $scope.cancelViewer = function() {
      $scope.viewing = false;
      removeStreams();
      $scope.janusManager.detachAllPlugins();
      $scope.janusManager.startVideoRoom();
    };

    $scope.socket = SocketManager.init();
    $scope.MAIN_STREAM_ID = 'video-container';
    $scope.channel = $stateParams.channel;
    $scope.user = {
      name: 'Caesarofthesky',
      image: 'fonts/scott.jpg'
    };

    function removeStreams() {
      $scope.$broadcast('removeStreams');
    }

    function attachStream(stream, element, opts) {
      element = element || document.createElement('video');
      opts = _.defaults(opts || {}, {
        autoplay: true,
        muted: false,
        id: null
      });

      if (opts.autoplay) {
        element.autoplay = 'autoplay';
      }

      if (opts.muted) {
        element.muted = true;
      }

      attachMediaStream(element, stream);
      $scope.$broadcast('attachStream', {
        element: element,
        id: opts.id
      });
    }

    $scope.janusManager = JanusManager(initedJanus);
    $scope.janus = $scope.janusManager.janus;
    $scope.janusManager.onStream = attachStream;
    $scope.janusManager.startVideoRoom();
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
        connection: '=',
        socket: '='
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
              $scope.socket.standardEmit(toggleEvent, {
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
              var queries = url.match(/start=(.*)/) || url.match(/t=(.*)/) || '';
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
      }
    };
  });

  app.directive('additionalInfo', function() {
    return {
      scope: {
        janus: '='
      },
      templateUrl: 'scripts/additionalInfo.html',
      link: function($scope) {
        $scope.topic = 'Guinea pig merits';
        $scope.recordings = {
          list: []
        };

        $scope.view = function(recording) {
          $scope.$emit('view', recording.id);
        };

        $scope.janus.attach({
          plugin: 'janus.plugin.recordplay',
          success: function getVideos(pluginHandle) {
            pluginHandle.send({
              message: {request: 'list'},
              success: function(res) {
                angular.copy(res.list, $scope.recordings.list);
                $scope.$digest();
              }
            });
          }
        });
      }
    };
  });

  app.directive('viewer', function($rootScope) {
    return {
      scope: {
        socket: '='
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
            $scope.socket.standardEmit($scope.socketEvent, {});
            $scope.socketEvent = '';
            $scope.overlay = false;
            $scope.displayContent.video = true;
          }
        };
      }
    };
  });

  app.directive('persist', function() {
    return {
      scope: {},
      templateUrl: 'scripts/persist.html',
      replace: true,
      restrict: 'E',
      link: function($scope) {
        $scope.notImplemented = function() {
          alert('Not Yet Implemented!');
        };
      }
    };
  });

  app.directive('chat', function() {
    return {
      scope: {
        socket: '='
      },
      templateUrl: 'scripts/chat.html',
      replace: true,
      restrict: 'E',
      link: function($scope) {
        $scope.chats = [];
        $scope.text = {
          input: ''
        };

        var username = ['bliggybloff', 'bb', 'guineaPigz', 'bLiners', 'MoshiMoshi', 'Gogurt Cop', 'Most Wise Tooth'][Math.floor(Math.random() * 7)];
        $scope.socket.on('chat-received', function(chat) {
          $scope.chats.push(chat);
        });

        $('#chat-text').keypress(function submitChat(e) {
          var ENTER_KEY = 13;
          if (e.which === ENTER_KEY) {
            $scope.socket.standardEmit('chat-sent', {text: $scope.text.input, username: username});
            $scope.text.input = '';
          }
        });
      }
    };
  });
})();
