(function() {
  'use strict';
  var AWS = require('aws-sdk');
  var fs = require('fs');
  var util = require('util');
  var EventEmitter = require('events').EventEmitter;
  var S3Mockup = require('./S3Mockup');

  var S3Uploader = module.exports = function(params) {
    this.Bucket = params.Bucket || null;
    this.mockupOptions = {
      bucketPath: params.MockupBucketPath || null,
      port: params.MockupServerPort || null
    };

    if (this.Bucket === 'MOCKUP') {
      this.s3 = new S3Mockup(this.mockupOptions);
      if (!this.s3.isServerUp()) {
        this.s3.on('serverStarted', function() {
          this.emit('mockupServerStarted');
        }.bind(this));
      }
    } else {
      this.s3 = new AWS.S3();
    }
  };

  S3Uploader.prototype = {
    isMockupServerUp: function() {
      return this.Bucket === 'MOCKUP' ? this.s3.isServerUp() : false;
    },
    send: function(params, callback) {
      var bucket = params['Bucket'] || this.Bucket;
      var key = params['Key'] || null;
      var file = Buffer.isBuffer(params['File']) ? params['File'] : null;
      if (!bucket || !key || !file) {
        return callback(new Error('Missing properties'));
      }

      var options = params['options'] || {};
      var s3UploadParams = {
        Bucket: bucket,
        Key: key,
        Body: file,
        ACL: options['ACL'] ? options['ACL'] :'private',
        ContentType: options['ContentType'] ? options['ContentType'] : 'image/jpeg',
        StorageClass: options['StorageClass'] ? options['StorageClass'] : 'STANDARD'
      };
      var uploader = this.s3.upload(s3UploadParams);

      // Http uploading progress event.
      uploader.on('httpUploadProgress', function(progress) {
        uploader.emit('progress', progress);
      });

      // Start uploading file to S3 bucket
      uploader.send(callback);

      return uploader;
    }
  };

  util.inherits(S3Uploader, EventEmitter);
})();
