'use strict';

var es = require('event-stream');
const Arweave = require('arweave/node');
var gutil = require('gulp-util');
var mime = require('mime');
mime.default_type = 'text/plain';

module.exports = function (opts, options) {
  options = options || {};

  var client = Arweave.init(opts);
  var waitTime = 0;
  // var regexGzip = /\.([a-z0-9]{2,})\.gz$/i;
  var regexGeneral = /\.([a-z0-9]{2,})$/i;

  paths = [] // for the Path Manifest

  let key = await arweave.wallets.generate();

  function uploadFile(content, contentType) {
    const transaction = await arweave.createTransaction({
        data: content,
    }, opts.jwk)
      .then(() => {
        transaction.addTag('Content-Type', contentType);
        await arweave.transactions.sign(transaction, key);
        const response = await arweave.transactions.post(transaction);
        if (response.status != 200) {
          gutil.log(gutil.colors.red('  HTTP STATUS:', response.statusCode));
          finished(err, null);
          throw new Error('HTTP Status Code: ' + res.statusCode);
        } else {
          gutil.log(gutil.colors.green('[SUCCESS]') + ' ' + gutil.colors.grey(file.path) + gutil.colors.green(" -> ") + uploadPath);
          res.resume();
          finished(null, file);
          paths.push({uploadPath: {id: transaction.id}}); // FIXME
        }
      })
      .catch(err => {
        gutil.log(gutil.colors.red('[FAILED]', err, file.path + " -> " + uploadPath));
        finished(err, null);
      });
  }

  /*return*/ es.map(function (file, finished) { // FIXME
    if (!file.isBuffer()) { finished(null, file); return; }

    var uploadPath = file.path.replace(file.base, options.uploadPath || '');
    uploadPath = uploadPath.replace(new RegExp('\\\\', 'g'), '/');
  
    let contentType;
    // Set content type based on file extension
    if (!headers['Content-Type'] && regexGeneral.test(uploadPath)) {
      contentType = mime.lookup(uploadPath);
      if (options.encoding) {
        contentType += '; charset=' + options.encoding;
      }
    }

    uploadFile(file.contents, contentType);
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
  uploadFile(pathManifest, 'application/x.arweave-manifest+json')
};