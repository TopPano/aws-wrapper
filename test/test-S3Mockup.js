'use strict';
var S3Mockup = require('../lib/S3Mockup');
var S3Uploader = require('../lib/S3Uploader');
var S3Remover = require('../lib/S3Remover');
var fs = require('fs');
var async = require('async');
var should = require('should');
var request = require('request');

describe('S3 Mock-up', function() {
  describe('Mock-up along', function() {
    var s3M;
    before(function(done) {
      s3M = new S3Mockup();
      s3M.on('serverStarted', function() {
        done();
      });
    });

    it('upload file', function(done) {
      var key = 'posts/1234/abcd/pan/src/2016-6-16/1.jpg.zip';
      var uploader = s3M.upload({
        Key: key,
        ContentType: 'image/jpeg',
        Body: fs.readFileSync('./fixtures/1.jpg.zip')
      });
      uploader.send(function(err, data) {
        if (err) { return done(err); }
        data.should.have.property('Key', key);
        data.should.have.property('Location', 'http://localhost:6559/' + key);
        done();
      });
    });

    it('get file', function(done) {
      var key = 'posts/1234/abcd/pan/src/2016-6-16/1.jpg.zip';
      var uploader = s3M.upload({
        Key: key,
        ContentType: 'image/jpeg',
        Body: fs.readFileSync('./fixtures/1.jpg.zip')
      });
      uploader.send(function(err, data) {
        if (err) { return done(err); }
        request.get('http://localhost:6559/' + key, function(err, res, body) {
          if (err) { return done(err); }
          res.statusCode.should.be.eql(200);
          res.headers['content-type'].should.be.eql('image/jpeg');
          done();
        });
      });
    });

    it('remove single file', function(done) {
      var key = 'posts/5678/efgh/pan/src/2016-6-16/1.jpg.zip';
      var uploader = s3M.upload({
        Key: key,
        ContentType: 'image/jpeg',
        Body: fs.readFileSync('./fixtures/1.jpg.zip')
      });
      uploader.send(function(err, data) {
        if (err) { return done(err); }
        var remover = s3M.deleteObject({Key: key});
        remover.send(function(err) {
          if (err) { return done(err); }
          done();
        });
      });
    });

    it('remove a list of files', function(done) {
      var objects = [
        {
          Key: 'posts/dead/beef/pan/src/2016-6-16/1.jpg.zip',
          ContentType: 'image/jpeg',
          Body: fs.readFileSync('./fixtures/1.jpg.zip')
        },
        {
          Key: 'posts/hihi/qqqq/pan/src/2016-6-17/1.jpg.zip',
          ContentType: 'image/jpeg',
          Body: fs.readFileSync('./fixtures/1.jpg.zip')
        }
      ];
      async.each(objects, function(object, callback) {
        var uploader = s3M.upload(object);
        uploader.send(function(err, data) {
          if (err) { return done(err); }
          callback();
        });
      }, function(err) {
        if (err) { return done(err); }
        var remover = s3M.deleteObject({
          Delete: {
            Objects: [
              { Key: objects[0].Key },
              { Key: objects[1].Key }
            ]
          }
        });
        remover.send(function(err) {
          if (err) { return done(err); }
          done();
        });
      });
    });
  });

  describe('S3Uploader enable mock-up mode', function() {
    var uploader;
    before(function(done) {
      uploader = new S3Uploader({ Bucket: 'MOCKUP' });
      if (!uploader.isMockupServerUp()) {
        uploader.on('mockupServerStarted', function() {
          done();
        });
      } else {
        done();
      }
    });

    it('upload object', function(done) {
      var key = 'posts/aaae8b3e6c098800/f806/live/thumb/2016-06-17/1.jpg.zip';
      uploader.send({
        File: fs.readFileSync('./fixtures/1.jpg.zip'),
        Key: key
      }, function(err, data) {
        if (err) { return done(err); }
        data.should.have.property('Key', key);
        data.should.have.property('Location', 'http://localhost:6559/' + key);
        done();
      });
    });

    it('return error if missing property', function(done) {
      var key = 'posts/aaae8b3e6c098800/f806/live/thumb/2016-06-17/1.jpg.zip';
      uploader.send({
        File: fs.readFileSync('./fixtures/1.jpg.zip')
      }, function(err) {
        err.should.have.property('message', 'Missing properties');
        done();
      });
    });

    it('return error if missing property', function(done) {
      var key = 'posts/aaae8b3e6c098800/f806/live/thumb/2016-06-17/1.jpg.zip';
      uploader.send({
        File: fs.readFileSync('./fixtures/1.jpg.zip')
      }, function(err) {
        err.should.have.property('message', 'Missing properties');
        done();
      });
    });
  });

  describe('S3Remover enable mock-up mode', function() {
    var uploader, remover;
    before(function(done) {
      uploader = new S3Uploader({ Bucket: 'MOCKUP' });
      if (!uploader.isMockupServerUp()) {
        uploader.on('mockupServerStarted', function() {
          remover = new S3Remover({ Bucket: 'MOCKUP' });
          done();
        });
      } else {
        remover = new S3Remover({ Bucket: 'MOCKUP' });
        done();
      }
    });

    it('remove object', function(done) {
      var key = 'posts/aaae8b3e6c098800/f806/live/thumb/2016-06-17/1.jpg.zip';
      uploader.send({
        File: fs.readFileSync('./fixtures/1.jpg.zip'),
        Key: key
      }, function(err) {
        if (err) { return done(err); }
        remover.remove({
          Key: key
        }, function(err) {
          if (err) { return done(err); }
          done();
        });
      });
    });
  });
});
