'use strict';
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('static', gulp.series(function () {
  return gulp.src(['**/*.js', '!**/*protocol_buffers*.js'])
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}));

gulp.task('nsp', gulp.series(function (cb) {
  return nsp('package.json', cb);
}));

gulp.task('pre-test', gulp.series(function () {
  return gulp.src('lib/**/*.js')
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire());
}));

gulp.task('test', gulp.series('pre-test', function (cb) {
  var mochaErr;

  return gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'})) // nyan
    .on('error', function (err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', function () {
      cb(mochaErr);
    });
}));

gulp.task('browserify', gulp.series(function () {
  //todo : minify
  return browserify('./lib/signalfx_browser.js', { standalone: 'signalfx.streamer' })
    .exclude('bufferutil')
    .exclude('utf-8-validate')
    //do NOT bundle websockets because the browser will provide it
    .exclude('ws')
    .bundle()
    .pipe(source('signalfx.js'))
    .pipe(gulp.dest('./build/'));
}));

gulp.task('prepublish', gulp.series(function (done) {
  done();
}));
gulp.task('default', gulp.series('static', 'test', function (done) {
  done();
}));
