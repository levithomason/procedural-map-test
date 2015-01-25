(function() {
    'use strict';

    var gulp = require('gulp');
    var connect = require('gulp-connect');
    var open = require('gulp-open');

    var path = {};
    path.root = './';
    path.game = path.root + 'game/';
    path.assets = path.game + 'assets/';
    path.css = path.game + 'css/';
    path.js = path.game + 'js/';
    path.indexHtml = path.game + 'index.html';

    var glob = {
        allFiles: '**/*.*'
    };

    gulp.task('serve', function(cb) {
        connect.server({
            root: [path.game],
            port: 8000,
            host: 'localhost',
            https: true,
            livereload: true
        });

        gulp.watch([path.game + glob.allFiles], ['reload']);

        cb();
    });

    gulp.task('reload', function() {
        return gulp.src([path.game + glob.allFiles])
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
