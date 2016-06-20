(function() {
  'use strict';
  var fs = require('fs');
  var path = require('path');
  var util = require('util');
  var async = require('async');
  var mkdirp = require('mkdirp');
  var merge = require('merge'); // don't need this if update to ES6
  var Express = require('express');
  var EventEmitter = require('events').EventEmitter;

  var mockupInstance = null;
  var server = null;
  var serverRunning = false;
  var objMetaTable = {};

  var Uploader = function(params) {
    this.bucketPath = params.bucketPath;
    this.http = params.http;
    this.key = params.Key;
    this.contentType = params.ContentType;
    this.body = params.Body;
  };
  Uploader.prototype = {
    send: function(callback) {
      var file = path.join(this.bucketPath, this.key);
      var http = this.http;
      var key = this.key;
      var contentType = this.contentType || 'text/plain';
      mkdirp(path.dirname(file), function(err) {
        if (err) { return callback(err); }
        fs.writeFile(file, function(err) {
          if (err) { return callback(err); }
          objMetaTable[key] = { contentType: contentType };
          var data = {
            Key: key,
            Location: http + '/' + key
          };
          callback(null, data);
        });
      });
    }
  };

  var Remover = function(params) {
    this.bucketPath = params.bucketPath;
    this.key = params.Key || null;
    this.list = (params.Delete && typeof params.Delete === 'object') ? params.Delete : null;
  };
  Remover.prototype = {
    send: function(callback) {
      var bucketPath = this.bucketPath;
      if (this.key) {
        delete objMetaTable[this.key];
        var file = path.join(bucketPath, this.key);
        rmFile(file, callback);
      } else if (this.list) {
        async.each(this.list.Objects, function(obj, callback) {
          delete objMetaTable[obj.key];
          var file = path.join(bucketPath, obj.Key);
          rmFile(file, callback);
        }, function(err) {
          if (err) { return callback(err); }
          callback();
        });
      } else {
        callback();
      }

      function rmFile(file, callback) {
        // check if the file exists
        fs.access(file, fs.F_OK, function(err) {
          if (err) {
            // S3 won't spit error even the object key does not exist
            return callback();
          }
          // delete the file
          fs.unlink(file, function(err) {
            if (err) { return callback(err); }
            // delete the file's parent directories until reach a non-empty directory
            rmDir(path.dirname(file), callback);
          });
        });

        // Recursively delete directory until reach a directory that is not empty
        function rmDir(dir, callback) {
          fs.rmdir(dir, function(err) {
            if (err) {
              // XXX: stop rmDir if the current directory is not empty
              return callback();
            }
            return rmDir(path.dirname(dir), callback);
          });
        }
      }
    }
  };

  var S3Mockup = function(options) {
    this.options = options || {};
    this.bucketPath = this.options.bucketPath || path.join(__dirname, 'data');
    this.port = this.options.port || 6559;

    var handleGetData = function (req, res) {
      var contentType = objMetaTable[req.path.slice(1)] ? objMetaTable[req.path.slice(1)].contentType : null;
      if (!contentType) { return res.status(404).send('File Not Found'); }
      var file = path.join(this.bucketPath, req.path);
      fs.access(file, fs.F_OK, function(err) {
        if (err) { return res.status(404).send('File Not Found'); }
        fs.readFile(file, function(err, data) {
          if (err) { return res.status(500).send('Internal Error'); }
          res.set('Content-Type', contentType);
          res.send(data);
        });
      });
    };

    if (!server) {
      server = new Express();
      server.get('*', handleGetData.bind(this));
      server.listen(this.port, function(err) {
        if (err) { throw Error('Unable to start server, error: ' + err); }
        console.info('==> S3 server mock-up is now listening on port: ' + this.port);
        serverRunning = true;
        this.emit('serverStarted');
      }.bind(this));
    }
  };
  S3Mockup.prototype = {
    isServerUp: function() {
      return serverRunning;
    },
    upload: function(params) {
      var options = {
        bucketPath: this.bucketPath,
        http: 'http://localhost:' + this.port
      };
      merge(options, params);
      return new Uploader(options);
    },
    deleteObject: function(params) {
      var options = {
        bucketPath: this.bucketPath,
      };
      merge(options, params);
      return new Remover(options);
    }
  };

  module.exports = function mockupFactory(params) {
    if (!mockupInstance) {
      mockupInstance = new S3Mockup(params);
      return mockupInstance;
    } else {
      return mockupInstance;
    }
  };

  util.inherits(Uploader, EventEmitter);
  util.inherits(Remover, EventEmitter);
  util.inherits(S3Mockup, EventEmitter);
})();
