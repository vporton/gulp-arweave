const gulp = require('gulp');
const gulpAirweave = require('./index');

const arweaveInit = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
};

gulp.task('default', () => {
  gulp.src('./testfiles/**', {read: true}).pipe(gulpAirweave(arweaveInit, {}))
  //.pipe(gulp.dest('dist'))
});