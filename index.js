'use strict';

var es = require('event-stream');
// var knox = require('knox');
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

  return es.map(function (file, finished) {
    if (!file.isBuffer()) { finished(null, file); return; }

    var uploadPath = file.path.replace(file.base, options.uploadPath || '');
    uploadPath = uploadPath.replace(new RegExp('\\\\', 'g'), '/');
    
    // Set content type based on file extension
    // if (!headers['Content-Type'] && regexGeneral.test(uploadPath)) {
    //   headers['Content-Type'] = mime.lookup(uploadPath);
    //   if (options.encoding) {
    //     headers['Content-Type'] += '; charset=' + options.encoding;
    //   }
    // }

    var contentLength = 0;
    if(file.stat != null)
      contentLength = file.stat.size; // In case of a stream
    else
      contentLength = file.contents.length; // It may be a buffer

    // headers['Content-Length'] = contentLength;

    let key = await arweave.wallets.generate();

    try {
      const transaction = await arweave.createTransaction({
          data: file.contents,
      }, opts.jwk);
      if(transaction.id == "") {
        gutil.log(gutil.colors.red('[FAILED]', "File not uploaded", file.path + " -> " + uploadPath));
        finished(err, null);
      } else {
        gutil.log(gutil.colors.green('[SUCCESS]') + ' ' + gutil.colors.grey(file.path) + gutil.colors.green(" -> ") + uploadPath);
        res.resume();
        finished(null, file);
        paths.push({uploadPath: {id: transaction.od}})
      }
    }
    catch(err) {
        gutil.log(gutil.colors.red('[FAILED]', err, file.path + " -> " + uploadPath));
        finished(err, null);
      }
    }
  });
};