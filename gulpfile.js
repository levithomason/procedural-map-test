(function() {
    'use strict';

    var gulp = require('gulp');
    var connect = require('gulp-connect');

    gulp.task('serve', function(cb) {
        connect.server({
            root: ['.', 'game'],
            https: true,
            livereload: true
        });

        cb();
    });

    gulp.task('reload', function() {
        return gulp.src(['game/**/*.*'])
            .pipe(connect.reload());
    });
    
    gulp.watch(['game/**/*.*'], ['reload']);
}());
