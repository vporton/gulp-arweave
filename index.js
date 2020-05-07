'use strict';

var es = require('event-stream');
const Arweave = require('arweave/node');
var gutil = require('gulp-util');
var mime = require('mime');
mime.default_type = 'text/plain';

module.exports = function (airweaveInit, options) {
  options = options || {};

  var arweave = Arweave.init(airweaveInit);
  var regexGeneral = /\.([a-z0-9]{2,})$/i;

  paths = [] // for the Path Manifest

  async function uploadFile(content, contentType) {
    const transaction = await arweave.createTransaction({
        data: content,
    }, airweaveInit.jwk)
      .then(async () => {
        transaction.addTag('Content-Type', contentType);
        // TODO: more tags
        await arweave.transactions.sign(transaction, jwk);
        const response = await arweave.transactions.post(transaction);
        if (response.status != 200) {
          gutil.log(gutil.colors.red('  HTTP STATUS:', response.statusCode));
          throw new Error('HTTP Status Code: ' + response.statusCode);
        } else {
          gutil.log(gutil.colors.green('[SUCCESS]') + ' ' + gutil.colors.grey(file.path) + gutil.colors.green(" -> ") + uploadPath);
          paths.push({uploadPath: {id: transaction.id}});
        }
      })
      .catch(err => {
        gutil.log(gutil.colors.red('[FAILED]', err, file.path + " -> " + uploadPath));
        throw err;
      });
  }

  /*return*/ es.map(function (file, finished) { // FIXME
    if (!file.isBuffer()) { finished(null, file); return; }

    var uploadPath = file.path.replace(file.base, options.uploadPath || '');
    uploadPath = uploadPath.replace(new RegExp('\\\\', 'g'), '/');
  
    let contentType;
    // Set content type based on file extension
    if (regexGeneral.test(uploadPath)) {
      contentType = mime.lookup(uploadPath);
      if (options.encoding) {
        contentType += '; charset=' + options.encoding;
      }
    }

    try {
      uploadFile(file.contents, contentType);
      finished(null, file);
    }
    catch(err) {
      finished(err);
    }
  });

  // Path Manifest upload
  const pathManifestObj = {
    manifest: "arweave/paths",
    version: "0.1.0",
    // "index": { // TODO
    //   "path": "index.html"
    // },
    paths: paths,
  }
  const pathManifest = JSON.stringify(pathManifestObj);
  try {
    uploadFile(pathManifest, 'application/x.arweave-manifest+json')
  }
  catch(err) { }
};