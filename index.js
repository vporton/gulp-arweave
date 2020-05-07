'use strict';

var Vinyl = require('vinyl');
var es = require('event-stream');
var Arweave = require('arweave/node');
var gutil = require('gulp-util');
var mime = require('mime');
var fs = require('fs');
var util = require('util');
mime.default_type = 'text/plain';

const readFile = util.promisify(fs.readFile);

module.exports = function (arweaveInit, options) {
  options = options || {};

  const jwkFile = arweaveInit.jwk || process.env.GULP_AIRWEAVE_JWK_FILE;
  if (typeof jwkFile == 'undefined') throw Error("Arweave JWK key is unspecified. Use GULP_AIRWEAVE_JWK_FILE env war.");
  const jwk = JSON.parse(fs.readFileSync(jwkFile));

  var arweave = Arweave.init(arweaveInit); // TODO: Alternatively pass already initialized arweave
  var regexGeneral = /\.([a-z0-9]{2,})$/i;

  let paths = []; // for the Path Manifest
  let pathsMap = new Map();

  async function uploadFile(file, contentType, uploadPath) {
    return await arweave.createTransaction({
        data: file.contents,
    }, jwk)
      .then(async (transaction) => {
        transaction.addTag('Content-Type', contentType);
        // TODO: more tags
        await arweave.transactions.sign(transaction, jwk);
        const response = await arweave.transactions.post(transaction);
        if (response.status != 200 && response.status != 208) {
          gutil.log(gutil.colors.red('  HTTP STATUS:', response.statusCode)); // TODO: Also show the response body
          throw new Error('HTTP Status Code: ' + response.statusCode);
        } else {
          gutil.log(gutil.colors.green('[SUCCESS]') + ' ' + gutil.colors.grey(file.path) + gutil.colors.green(" -> ") + uploadPath);
          paths.push({uploadPath: {id: transaction.id}});
          pathsMap.set(uploadPath, transaction.id);
        }
        return transaction.id;
      })
      .catch(err => {
        gutil.log(gutil.colors.red('[FAILED]', err, file.path + " -> " + uploadPath));
        throw err;
      });
  }

  let outputStream = es.map(function (file, finished) { // FIXME
    // Skip processing of directories:
    if (file.isDirectory()) { finished(); return; }
    
    if (!file.isBuffer()) { finished("Only buffer mode is supported."); return; }

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
      // TODO: Resolve transation IDs asynchronously.
      uploadFile(file, contentType, uploadPath)
        .then(transactionId => {
          finished(null, [uploadPath, transactionId]);
        });
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
  var manifestFile = new Vinyl({
    cwd: '/',
    base: '/',
    path: '/manifest.json', // unused
    contents: new Buffer(pathManifest),
  });
  try {
    uploadFile(manifestFile, 'application/x.arweave-manifest+json', '/')
      .then(transactionId => {
        // finished(null  , [uploadPath, transactionId]);
        //paths.push(({"": {id: transaction.id}});
        pathsMap.set("", transactionId);
        console.log(transactionId)
      });
  }
  catch(err) { }

  return outputStream;

  // FIXME: Merge will not work for gulp 4. merge-stream should be used.
};