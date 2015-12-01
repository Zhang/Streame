// Generated on 2015-09-03 using generator-ionic 0.7.3
'use strict';

var jshint = require('jshint-stylish');

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    paths: {
      public: 'public',
      less: 'public/less',
      bower: 'public/vendor'
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: jshint
      },
      all: [
        'Gruntfile.js',
        '**/*.js'
      ]
    },
    less: {
      build: {
        files: {
          '<%= paths.public %>/styles.css': '<%= paths.less %>/app.less'
        },
        options: {
          cleancss: true,
          strictMath: true
        }
      }
    },
    htmlbuild: {
      dist: {
        src: '<%= paths.public %>/config/index.html',
        dest: 'public/',
        options: {
          beautify: true,
          scripts: {
            bower: [
              '<%= paths.bower %>/angular/angular.min.js',
              '<%= paths.bower %>/lodash/lodash.js',
              '<%= paths.bower %>/angular-ui-router/release/angular-ui-router.min.js',
              '<%= paths.bower %>/socket.io-client/socket.io.js',
              '<%= paths.bower %>/angular-socket-io/socket.js',
              '<%= paths.bower %>/jquery/dist/jquery.min.js',
              '<%= paths.bower %>/peerjs/peer.js',
              '<%= paths.bower %>/angular-uuid4/angular-uuid4.js',
              '<%= paths.bower %>/webrtc-adapter/adapter.js',
              '<%= paths.bower %>/angular-cookies/angular-cookies.js',
              '<%= paths.bower %>/angular-bootstrap/ui-bootstrap-tpls.js',
              '<%= paths.bower %>/janus/html/janus.js',
            ],
            app: '<%= paths.public %>/scripts/**/*.js',
          },
          styles: {
            app: [
              '<%= paths.public %>/fonts/bootstrap.min.css',
              '<%= paths.public %>/fonts/webfonts/ss-emoji.css',
              '<%= paths.public %>/styles.css'
            ]
          }
        }
      }
    },
    watch: {
      scripts: {
        files: ['public/scripts/**/*.js'],
        tasks: ['htmlbuild'],
        options: {
          spawn: false,
        }
      },
      less: {
        files: ['<%= paths.less %>/**/*.less'],
        tasks: ['less:build']
      },
      template: {
        files: 'public/config/index.html',
        tasks: ['htmlbuild']
      }
    },
  });

};
