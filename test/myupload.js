const gulpAirweave = require('../index');

gulp.src('../testfiles/**', {read: false})
    .pipe(gulpAirweave(AWS, options));
