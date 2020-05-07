const gulp = require('gulp');
const gulpAirweave = require('./index');
var es = require('event-stream');

const arweaveInit = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
};

function* iterableify(stream) {
  yield* es.mapSync(function* (element, finished) { // FIXME
    yield element;
    finished();
  });
}

gulp.task('default', async () => {
  let uploads = gulp.src('./testfiles/**', {read: true}).pipe(gulpAirweave(arweaveInit, {}));
  // TODO: Create an async iterator package to use instead of `writeArray`.
  uploads.pipe(es.writeArray(function (err, array){
    console.log(array);
  }));
});
