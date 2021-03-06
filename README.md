# gulp-s3 [![NPM version][npm-image]][npm-url]

(Based on https://github.com/nitaigao/gulp-s3)

> Arweave plugin for [gulp](https://github.com/wearefractal/gulp)

## Usage

First, install `gulp-arweave` as a development dependency:

```shell
npm install --save-dev gulp-arweave
```


Then, use it in your `gulpfile.js`:
```javascript
var arweave = require('gulp-arweave')
var gulp    = require('gulp')

const arweaveInit = {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    jwk: "passwords/arweave-keyfile-XXX.json", // or specify the JWT object here, or use GULP_AIRWEAVE_JWK_FILE env var
};

const options = {};

gulp.src('./testfiles/**', {read: true})
    .pipe(gulpAirweave(arweaveInit, options));
```

Or you can pass an already initialized `Arweave` object as `arweaveInit`

The `pipe` returns an `EventStream` of pairs of an Arweave path and transaction ID.

## API

#### options.uploadPath

Type: `String`          
Default: ``

Set the remote folder on Arweave.

```javascript
var options = { uploadPath: 'remote-folder' } // It will upload the 'src' into '/remote-folder'
gulp.src('./dist/**', {read: true})
    .pipe(gulpAirweave(arweaveInit, options));
```

#### `options.tags`

Set tags for every uploaded file. (If `'Content-Type'` is unspecified, it is determined
automatically from file extensions.)

```
gulp.src('./testfiles/**', {read: true})
    .pipe(gulpAirweave(arweaveInit, { tags: {'X-My-Tag', 'zzz'} }));
```

#### `options.encoding`

Encoding for uploaded files.

#### `options.rootFile`

The index file (including its full path on the server).

#### `options.disableManifest`

Disable creating the Path Manifest file.

#### `options.urlPrefix`

Prefix to add to output URLs:

```
const options = { urlPrefix: 'https://arweave.net/' };

gulp.src('./testfiles/**', {read: true})
    .pipe(gulpAirweave(arweaveInit, options));
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/gulp-s3
[npm-image]: https://badge.fury.io/js/gulp-s3.png
