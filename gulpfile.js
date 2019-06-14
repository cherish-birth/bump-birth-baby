const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const del = require('del')
const gulp = require('gulp')
const cachebust = require('gulp-cache-bust')
const htmlmin = require('gulp-htmlmin')
const mustache = require('gulp-mustache')
const postcss = require('gulp-postcss')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const server = require('gulp-server-livereload')
const sourcemaps = require('gulp-sourcemaps')
const path = require('path')
const pump = require('pump')

const isProduction = ['production', 'prod'].includes(process.env.NODE_ENV)
const paths = {
  src: 'src',
  dist: 'dist',
  copies: isProduction ? ['images'] : ['images', 'vendor'],
}

gulp.task('default', ['build'])
gulp.task('build', ['build:styles', 'build:copies'], () => gulp.run('build:html'))
gulp.task('clean', () => del(paths.dist))
gulp.task('serve', () =>
  gulp.src(paths.dist).pipe(
    server({
      host: process.env.HOST || '0.0.0.0',
      port: Number(process.env.PORT) || 8000,
      livereload: true,
    })
  )
)
gulp.task('watch', ['build'], () => {
  gulp.watch(path.join(paths.src, '**', '*.scss'), ['build:styles'])
  gulp.watch(path.join(paths.src, '**', '*.html'), ['build:html'])
  gulp.watch(paths.copies.map(copy => path.join(paths.src, copy, '**')), ['build:copies'])
})

/**
 * STYLES
 */
gulp.task('build:styles', ['clean:styles'], () =>
  pump([
    gulp.src(path.join(paths.src, 'styles', 'style.scss')),
    sourcemaps.init(),
    sass(),
    postcss([autoprefixer(), cssnano()]),
    rename('styles.min.css'),
    sourcemaps.write('.'),
    gulp.dest(paths.dist),
  ])
)
gulp.task('clean:styles', () =>
  del([path.join(paths.dist, '*.min.css'), path.join(paths.dist, '*.min.css.map')])
)

/**
 * HTML
 */
gulp.task('build:html', ['clean:html'], () =>
  pump([
    gulp.src(path.join(paths.src, '*.html')),
    mustache({ isProduction }),
    cachebust({ basePath: path.join(paths.dist, '/') }),
    htmlmin({ collapseWhitespace: true, removeComments: true }),
    gulp.dest(paths.dist),
  ])
)
gulp.task('clean:html', () => del(path.join(paths.dist, '*.html')))

/**
 * COPIES
 */
gulp.task('build:copies', ['clean:copies'], () => {
  paths.copies.forEach(copy =>
    pump([gulp.src(path.join(paths.src, copy, '**')), gulp.dest(path.join(paths.dist, copy))])
  )
})
gulp.task('clean:copies', () => del(paths.copies.map(copy => path.join(paths.dist, copy))))
