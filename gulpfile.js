const gulp = require('gulp')
const uglify = require('gulp-uglify')
const cleanCSS = require('gulp-clean-css')
const concat = require('gulp-concat')

gulp.task('minify-js', function () {
  return gulp.src('assets/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public'))
})

gulp.task('minify-css', function () {
  return gulp.src('assets/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('public'))
})

gulp.task('default', gulp.parallel('minify-js', 'minify-css'))
