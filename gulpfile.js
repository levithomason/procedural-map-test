(function() {
    'use strict';

    var gulp = require('gulp');
    var connect = require('gulp-connect');
    var open = require('gulp-open');

    var path = {
        assets: './assets/',
        css: './css/',
        js: './js/',
        indexHtml: './index.html',
    };

    var glob = {
        allFiles: '**/*.*'
    };

    gulp.task('serve', function(cb) {
        connect.server({
            root: ['.'],
            port: 8000,
            host: 'localhost',
            https: true,
            livereload: true
        });

        gulp.watch([
            path.assets + glob.allFiles,
            path.css + glob.allFiles,
            path.js + glob.allFiles,
        ], ['reload']);

        cb();
    });

    gulp.task('reload', function() {
        return gulp.src([
            path.assets + glob.allFiles,
            path.css + glob.allFiles,
            path.js + glob.allFiles,
        ])
            .pipe(connect.reload());
    });

    gulp.task('open', function() {
        return gulp.src(path.indexHtml)
            .pipe(open('', {
                url: 'https://localhost:8000',
                app: 'google chrome'
            }));
    });

    gulp.task('default', [
        'serve',
        'open'
    ]);
}());
