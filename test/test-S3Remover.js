var S3Remover = require('../lib/S3Remover');

var remover = new S3Remover();
var params = {
  Bucket: 'Your target bucket name', /* Required */
  Key: 'Your target object name', /* Requred */
};

remover.on('success', function(data) {
  console.log('Success Deleting: ', data);
}).on('error', function(err) {
  console.log('Erro occuring while deleting: ', err);
});

remover.remove(params);

