const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const ts = require('gulp-typescript');

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('compile', () => {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['compile'], () => {
  gulp.watch('src/**/*.ts', ['compile']);
});

gulp.task('serve', ['watch'], function() {
  var stream = nodemon({
    script: 'dist/main.js'
  });
  return stream;
});

gulp.task('default', ['serve']);
