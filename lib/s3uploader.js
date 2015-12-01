var AWS = require('aws-sdk');
var fs = require('fs');
var s3 = new AWS.S3();

var params = {
  FilePath: 'Path to your uploaded file', /* Required */
  Bucket: 'Your destination bucket name', /* Required */
  Key: 'Your destination object key', /* Requred */
  options: {
    ACL: 'private',
    ContentType: 'image/jpeg',
    StorageClass: 'STANDARD'
  }
};

s3Upload(params, function(data) {
  console.log(data);
});

function s3Upload(params, callback) {
  var file = fs.createReadStream(params.FilePath);
  var accessContorlList = 'private',
      contentType = 'image/jpeg',
      storageClass = 'STANDARD';
  if(params.options !== undefined) {
    accessControlList =  params.options.ACL !== undefined ? params.options.ACL : accessControlList;
    ContentType: params.options.ContentType !== undefined ? params.options.ContentType : contentType;
    StorageClass: params.options.StorageClass !== undefined ? params.options.StorageClass : storageClass;
  }

  var s3UploadParams = {
    Bucket: params.Bucket,
    Key: params.Key,
    Body: file,
    ACL: accessContorlList,
    ContentType: contentType,
    StorageClass: storageClass
  };
  var uploader = s3.upload(s3UploadParams);
  
  // Error handling for reading file
  file.on('error', function(err) {
    console.log('Error while loading file ' + params.FilePath + ':');
    console.log(err);
  });
  // Show the HTTP uploading porgress
  uploader.on('httpUploadProgress', function(progress) {
    var loaded = progress.loaded,
        total = progress.total;
    console.log('HTTP Uploading Progress for ' + params.FilePath + ': '
                  + (loaded / total * 100) + '%, '
                  + loaded + '/' + total + ' bytes');
  });

  // Start uploading file to S3 bucket
  uploader.send(function(err, data) {
    if(err) { // Error handling for uploading file
      console.log('Error ocurs while uploading ' + params.FilePath + ':');
      console.log(err)
    } else { // Success uploading, invoke callback function if necessary
      console.log('Success uploading file ' + params.FilePath);
      if(typeof callback === 'function') {
        callback(data);
      }
    }
  });
}
