var S3Uploader = require('../lib/S3Uploader');

var uploader = new S3Uploader();
var params = {
  File: 'Path to your uploaded file', /* Required */
  Bucket: 'Your destination bucket name', /* Required */
  Key: 'Your destination object key', /* Requred */
  options: {
    ACL: 'public-read',
    ContentType: 'image/jpeg',
    StorageClass: 'STANDARD'
  }
};

uploader.on('success', function(data) {
  console.log('Success uploading: ', data);
}).on('error', function(err) {
  console.log('Erro occuring while uploading: ', err);
}).on('progress', function(progress) {
  var loaded = progress.loaded,
      total = progress.total;
  console.log('Uploading progress: ' + (loaded / total * 100) + '%, ' + loaded + '/' + total + ' bytes');
});

uploader.send(params);

