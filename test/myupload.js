const gulp = require('gulp');
const gulpAirweave = require('../index');

const arweaveInit = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
};

// gulp.src('testfiles/**', {read: false})
//     .pipe(gulpAirweave(arweaveInit, {}));

console.log(
    gulp.src('testfiles/**', {read: false})
        gulpAirweave(arweaveInit, {})
);
