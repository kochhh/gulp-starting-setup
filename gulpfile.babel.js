'use strict'

import { src, dest, watch, series, parallel } from 'gulp'

// dev
import server from 'browser-sync'
import del from 'del'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import wait from 'gulp-wait'
import rename from 'gulp-rename'

// html
import pug from 'gulp-pug'

// css
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssimport from 'postcss-import'
import cssnano from 'cssnano'
import gcmq from 'gulp-group-css-media-queries'

// js
import terser from 'gulp-terser'
import rollup from 'gulp-better-rollup'
import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

// img
// import imagemin from 'gulp-imagemin'
import svgmin from 'gulp-svgmin'
import cheerio from 'gulp-cheerio'
import svgSprite from 'gulp-svg-sprite'
import replace from 'gulp-replace'

const source = ((base) => ({
  pug:    `${base}/pug`,
  css:    `${base}/static/sass`,
  js:     `${base}/static/js`,
  img:    `${base}/static/img`,
  fonts:  `${base}/static/fonts`,
}))('src')

const build = ((base) => ({
  root:   `${base}`,
  css:    `${base}/static/css`,
  js:     `${base}/static/js`,
  img:    `${base}/static/i`,
  fonts:  `${base}/static/fonts`,
}))('dist')

const Server = server.create()

const errorHandler = function() {
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>',
    sound: 'Submarine'
  }).apply(this, [...arguments])
  this.emit('end')
}

export const clean = () => del([`${build.root}/`])

export function serverInit() {
  Server.init({
    server: {
      baseDir: `${build.root}/`
    },
    port: 8080,
    logLevel: 'info',
    logConnections: false,
    logFileChanges: true,
    open: false,
    ui: false,
    notify: false,
    ghostMode: false,
    reloadDelay: 500
  })
}

export function html() {
  return src(`${source.pug}/pages/*.pug`)
    .pipe(pug({ pretty: true }))
    .pipe(plumber({ errorHandler }))
    .pipe(Server.stream({ once: true }))
    .pipe(dest(`${build.root}/`))
}

export function stylesDev() {
  return src(`${source.css}/app.scss`)
    .pipe(plumber({ errorHandler }))
    .pipe(wait(500))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      precision: 4
    }))
    .pipe(sourcemaps.write())
    .pipe(postcss([
      cssimport(),
      autoprefixer()
    ]))
    .pipe(rename({ basename: 'main' }))
    .pipe(dest(`${build.css}/`))
    .pipe(Server.stream())
}

export function stylesBuild() {
  return src(`${source.css}/app.scss`)
    .pipe(plumber({ errorHandler }))
    .pipe(wait(500))
    .pipe(sass({
      outputStyle: 'expanded',
      precision: 4
    }))
    .pipe(postcss([
      cssimport(),
      autoprefixer()
    ]))
    .pipe(gcmq())
    .pipe(rename({ basename: 'main' }))
    .pipe(dest(`${build.css}/`))
    .pipe(postcss([
      cssnano()
    ]))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(`${build.css}/`))
}

export function jsCopy() {
  return src(`${source.js}/vendor/*.js`)
    .pipe(plumber({ errorHandler }))
    .pipe(dest(`${build.js}/vendor/`))
    .pipe(Server.stream())
}

export function jsLibs() {
  return src(`${source.js}/libs.js`)
    .pipe(plumber({ errorHandler }))
    .pipe(rollup({
      plugins: [
        nodeResolve(),
        commonjs({
          namedExports: {
            'node_modules/jquery/dist/jquery.js': ['jquery']
          }
        })
      ],
      onwarn: (warn, next) => { 
        // Suppress jquery this undefined msg
        (warn.code !== 'THIS_IS_UNDEFINED') && next(warn)
      }
    }, 'cjs'))
    .pipe(terser())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(`${build.js}/`))
    .pipe(Server.stream())
}

export function jsDev() {
  return src(`${source.js}/app.js`)
    .pipe(plumber({ errorHandler }))
    .pipe(sourcemaps.init())
    .pipe(rollup({
      plugins: [
        babel()
      ],
      onwarn: (warn, next) => { 
        // Suppress jquery this undefined msg
        (warn.code !== 'THIS_IS_UNDEFINED') && next(warn)
      }
    }, 'iife'))
    .pipe(sourcemaps.write(''))
    .pipe(rename({ basename: 'main' }))
    .pipe(dest(`${build.js}/`))
    .pipe(Server.stream())
}

export function jsBuild() {
  return src(`${source.js}/app.js`)
    .pipe(plumber({ errorHandler }))
    .pipe(rollup({
      plugins: [
        babel()
      ],
      onwarn: (warn, next) => { 
        // Suppress jquery this undefined msg
        (warn.code !== 'THIS_IS_UNDEFINED') && next(warn)
      }
    }, 'iife'))
    .pipe(rename({ basename: 'main' }))
    .pipe(dest(`${build.js}/`))
    .pipe(terser())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(`${build.js}/`))
}

export function imgDev() {
  return src(`${source.img}/**/*.{png,jpg,jpeg,webp}`)
    .pipe(plumber({ errorHandler }))
    .pipe(dest(`${build.img}/`))
}

export function imgBuild() {
  return src(`${source.img}/**/*.{png,jpg,jpeg,webp}`)
    .pipe(plumber({ errorHandler }))
    // .pipe(imagemin([
    //   imagemin.jpegtran({ progressive: true }),
    //   imagemin.optipng({ optimizationLevel: 5 })
    // ], {
    //   verbose: true
    // }))
    .pipe(dest(`${build.img}/`))
}

export function svgCopy() {
  return src(`${source.img}/*.svg`)
    .pipe(plumber({ errorHandler }))
    .pipe(dest(`${build.img}/`))
}

export function svg() {
  return src(`${source.img}/svg-icons/*.svg`)
    .pipe(plumber({ errorHandler }))
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe(cheerio({
      run($) {
        $('[fill]').removeAttr('fill')
        $('[stroke]').removeAttr('stroke')
        $('[style]').removeAttr('style')
      },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: 'sprite.svg'
        }
      }
    }))
    .pipe(dest(`${build.img}/icons/`))
}

export function fonts() {
  return src(`${source.fonts}/**/*.*`)
    .pipe(plumber({ errorHandler }))
    .pipe(dest(`${build.fonts}/`))
}

export function watchFiles() {
  watch(`${source.pug}/**/*.pug`, series('html'))
  watch(`${source.css}/**/*.scss`, series('stylesDev'))
  watch(`${source.js}/**/*.js`, series('jsDev'))
  watch(`${source.img}/**/*.{png,jpg,webp}`, series('imgDev'))
  watch(`${source.img}/svg-icons/*.svg`, series('svg'))
}

const taskDev = series(
  clean,
  parallel(html, stylesDev, jsCopy, jsLibs, jsDev, imgDev, svgCopy, svg, fonts, serverInit, watchFiles)
)

const taskBuild = series(
  clean,
  parallel(html, stylesBuild, jsCopy, jsLibs, jsBuild, imgBuild, svgCopy, svg, fonts)
)

export { taskDev as default, taskBuild as build }