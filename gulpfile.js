const gulp = require('gulp');
const gulpAirweave = require('./index');
var es = require('event-stream');

const arweaveInit = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
};

gulp.task('default', async () => {
  let uploads = gulp.src('./testfiles/**', {read: true})
    .pipe(gulpAirweave(arweaveInit, {rootFile: "a.txt", urlPrefix: 'https://arweave.net/'}));
  // TODO: Create an async iterator package to use instead of `writeArray`.
  uploads.pipe(es.writeArray(function (err, array){
    console.log(array);
  }));
});
