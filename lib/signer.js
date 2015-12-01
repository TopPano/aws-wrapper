var crypto = require('crypto');
var fs = require('fs');

var kpId = 'Your key-pair ID';
var pkPath = 'Path to your private key file (.pem)';
var url = 'Url to your object in cloudfront';

var params = {
  distributionUrl: distUrl, /* Required */
  key: 'Your object key', /* Required */
  life: 30000, /* Required */
  keypairId: kpId, /* Required */
  privateKeyFilePath: pkPath /* Required */
};
var signedUrl = genSignedUrl(params);
console.log(signedUrl + '\n');

params = {
  distributionUrl: distUrl, /* Required */
  keys: [ /* Required */
    'Your object key 0',
    'Your object key 1',
    'Your object key 2'
  ],
  commonPattern: 'Common pattern in your object keys', /* Required */
  life: 30000, /* Required */
  keypairId: kpId, /* Required */
  privateKeyFilePath: pkPath /* Required */
};
var signedUrls = genMultiSignedUrls(params);
signedUrls.forEach(function(url) {
  console.log(url + '\n');
});

/**
 * Generate a signed Url for a distribution object.
 */
function genSignedUrl(params) {
  var expires = Math.round((new Date().getTime() + params.life) / 1000);
  var url = params.distributionUrl + '/' + params.key;
  var policy = _genCustomPolicy(url, expires);
  var signature = _genSignature(policy, params.privateKeyFilePath);
  var signedUrl;

  policy = _getUrlSafeString(new Buffer(policy).toString('base64'));
  signedUrl = url + '?'
              + 'Policy=' + policy
              + '&Signature=' + signature
              + '&Key-Pair-Id=' + params.keypairId;

  return signedUrl;
}

/**
 * Generate signed Urls for a group of distribution objects
 * which have common pattern in their key names.
 */
function genMultiSignedUrls(params) {
  var expires = Math.round((new Date().getTime() + params.life) / 1000);
  var wildcardUrl = params.distributionUrl + '/*' + params.commonPattern + '*';
  var policy = _genCustomPolicy(wildcardUrl, expires);
  var signature = _genSignature(policy, params.privateKeyFilePath);
  var signedUrls = [];

  policy = _getUrlSafeString(new Buffer(policy).toString('base64'));
  params.keys.forEach(function(key) {
    var signedUrl = params.distributionUrl + '/' + key + '?'
                    + 'Policy=' + policy
                    + '&Signature=' + signature
                    + '&Key-Pair-Id=' + params.keypairId;
    signedUrls.push(signedUrl);
  });

  return signedUrls;
}

/**
 * Generate a custom policy.
 */
function _genCustomPolicy(url, expires) {
  var policy = {
    'Statement': [{
      'Resource': url,
      'Condition': {
        'DateLessThan': { 'AWS:EpochTime': expires }
      }
    }]
  };

  return JSON.stringify(policy);
}

/**
 * Generate a signature of the policy.
 */
function _genSignature(policy, pkFilePath) {
  var privateKey = fs.readFileSync(pkFilePath).toString('ascii');
  var signer = crypto.createSign('RSA-SHA1');

  signer.update(policy);
  signature = signer.sign(privateKey, 'base64');
  return _getUrlSafeString(signature);
}

/**
 * Replace base64-encoded characters that are invalid 
 * in a URL query string with characters that are valid.
 */
function _getUrlSafeString(str) {
  return str.replace(/\+/g, '-')
            .replace(/\=/g, '_')
            .replace(/\//g, '~');
}

