(function() {
  'use strict';
  var AWS = require('aws-sdk');
  var util = require('util');
  var EventEmitter = require('events').EventEmitter;
  var S3Mockup = require('./S3Mockup');

  var S3Remover = module.exports = function(params) {
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

  S3Remover.prototype = {
    isMockupServerUp: function() {
      return this.Bucket === 'MOCKUP' ? this.s3.isServerUp() : false;
    },
    remove: function(params, callback) {
      var s3RemoveParams = {
        Bucket: params['Bucket'] || this.Bucket
      };
      if (!s3RemoveParams['Bucket']) {
        return callback(new Error('Missing property: Bucket'));
      }

      var remover;
      if(util.isArray(params.Key)) {
        // Key is an array.
        s3RemoveParams.Delete = {
          Objects: [],
          Quiet: false
        };
        params.Key.forEach(function(key) {
          if(typeof key === 'string') {
            s3RemoveParams.Delete.Objects.push({ Key: key });
          }
        });
        remover = this.s3.deleteObjects(s3RemoveParams);
      } else if(typeof params.Key === 'string') {
        // Key is a string.
        s3RemoveParams.Key = params.Key;
        remover = this.s3.deleteObject(s3RemoveParams);
      } else {
        return callback(new Error('Wrong type of Key'));
      }

      // Start removing object(s) in S3 bucket.
      remover.send(callback);

      return remover;
    }
  };

  util.inherits(S3Remover, EventEmitter);
})();

