// Generated on 2015-09-03 using generator-ionic 0.7.3
'use strict';

var _ = require('lodash');
var path = require('path');
var jshint = require('jshint-stylish');

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.initConfig({
    app: {
      // configurable paths
      less: 'less',
    },

    // Make sure code styles are up to par and there are no obvious mistakes
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
          'styles.css': '<%= app.less %>/styles/app.less'
        },
        options: {
          cleancss: true,
          strictMath: true
        }
      }
    }
  });
};
