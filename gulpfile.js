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

/**
 * BUILD STYLES
 */
const cleanStyles = () =>
  del([path.join(paths.dist, '*.min.css'), path.join(paths.dist, '*.min.css.map')])
const buildStyles = () =>
  pump([
    gulp.src(path.join(paths.src, 'styles', 'style.scss')),
    sourcemaps.init(),
    sass(),
    postcss([autoprefixer(), cssnano()]),
    rename('styles.min.css'),
    sourcemaps.write('.'),
    gulp.dest(paths.dist),
  ])
const cleanAndBuildStyles = gulp.series(cleanStyles, buildStyles)

/**
 * BUILD HTML
 */
const cleanHtml = () => del(path.join(paths.dist, '*.html'))
const buildHtml = () =>
  pump([
    gulp.src(path.join(paths.src, '*.html')),
    mustache({ isProduction }),
    cachebust({ basePath: path.join(paths.dist, '/') }),
    htmlmin({ collapseWhitespace: true, removeComments: true }),
    gulp.dest(paths.dist),
  ])
const cleanAndBuildHtml = gulp.series(cleanHtml, buildHtml)

/**
 * BUILD COPIES
 */
const cleanCopies = () => del(paths.copies.map(copy => path.join(paths.dist, copy)))
const buildCopies = () =>
  Promise.all(
    paths.copies.map(copy =>
      pump([gulp.src(path.join(paths.src, copy, '**')), gulp.dest(path.join(paths.dist, copy))])
    )
  )
const cleanAndBuildCopies = gulp.series(cleanCopies, buildCopies)

const clean = () => del(paths.dist)
const build = gulp.series(clean, gulp.parallel(buildStyles, buildCopies), buildHtml)
const watch = () => {
  gulp.watch(path.join(paths.src, '**', '*.scss'), cleanAndBuildStyles)
  gulp.watch(path.join(paths.src, '**', '*.html'), cleanAndBuildHtml)
  gulp.watch(paths.copies.map(copy => path.join(paths.src, copy, '**')), cleanAndBuildCopies)
}
const serve = () =>
  gulp.src(paths.dist).pipe(
    server({
      host: process.env.HOST || '0.0.0.0',
      port: Number(process.env.PORT) || 8000,
      livereload: true,
    })
  )

exports.clean = clean
exports.serve = serve
exports.build = build
exports.watch = watch
exports.default = build
