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
        }
        return [transaction.id, uploadPath];
      })
      .catch(err => {
        gutil.log(gutil.colors.red('[FAILED]', err, file.path + " -> " + uploadPath));
        throw err;
      });
  }

  let fileTransactions = [];

  let outputStream = es.through(function write(file) {
    // Skip processing of directories:
    if (file.isDirectory()) { return; }
    
    if (!file.isBuffer()) { throw Error("Only buffer mode is supported."); }

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
      let pathsP = uploadFile(file, contentType, uploadPath)
        .then(([transactionId, uploadPath]) => {
          this.emit('data', [uploadPath, transactionId]);
          return [uploadPath, transactionId];
        });
      fileTransactions.push(pathsP);
    }
    catch(err) { }
  }, async function end() {
    const paths = await Promise.all(fileTransactions);
    // We can't use JS Object due to its security bug. So:
    function myToJSON(paths) {
      return paths.map(([uploadPath, transactionId]) =>
        JSON.stringify(uploadPath) + ':{"id":' + JSON.stringify(transactionId) + '}')
          .join(",");
    }

    // Path Manifest upload
    const pathManifestObj = '{' +
      'manifest:"arweave/paths",' +
      'version:"0.1.0",' +
      // "index": { // TODO
      //   "path": "index.html"
      // },
      'paths:' + myToJSON(paths) +
    '}';
    const pathManifest = JSON.stringify(pathManifestObj);
    console.log(pathManifest)
    var manifestFile = new Vinyl({
      cwd: '/',
      base: '/',
      path: '/manifest.json', // unused
      contents: new Buffer.from(pathManifest), // TODO: encoding
    });
  
    // Upload the manifest:
    await uploadFile(manifestFile, 'application/x.arweave-manifest+json', '/')
      .then(([transactionId, uploadPath]) => {
        this.emit('data', ['/', transactionId])
      });

    this.emit('end');
  });

  return outputStream;
};