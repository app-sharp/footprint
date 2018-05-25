import gulp from "gulp";
import {spawn} from "child_process";
import hugoBin from "hugo-bin";
import gutil from "gulp-util";
import flatten from "gulp-flatten";
import postcss from "gulp-postcss";
import cssImport from "postcss-import";
import cssnext from "postcss-cssnext";
import nestedcss from "postcss-nested";
import cssvars from "postcss-simple-vars-async";
import lostgrid from "lost";
import styleVariables from "./variables";
import BrowserSync from "browser-sync";
import webpack from "webpack";
import webpackConfig from "./webpack.conf";

// For img optimization
import runSequence from "run-sequence";
import fs from "fs";
import imagemin from "gulp-imagemin";
import responsive from "gulp-responsive";
import imgSrcSet from "gulp-responsive-imgz";
const $ = require('gulp-load-plugins')();
const DEST = "./dist/";

const browserSync = BrowserSync.create();

// Hugo arguments
const hugoArgsDefault = ["-d", "../dist", "-s", "site", "-v"];
const hugoArgsPreview = ["--buildDrafts", "--buildFuture"];

// Development tasks
gulp.task("hugo", (cb) => buildSite(cb));
gulp.task("hugo-preview", (cb) => buildSite(cb, hugoArgsPreview));

// Build/production tasks
// gulp.task("build", ["css", "js", "fonts"], (cb) => buildSite(cb, [], "production"));
// gulp.task("build-preview", ["css", "js", "fonts"], (cb) => buildSite(cb, hugoArgsPreview, "production"));
gulp.task("build", function(callback) {
  runSequence(["css", "js", "fonts", "hugo"], "optimize");
});
gulp.task("build-preview", function(callback) {
  runSequence(["css", "js", "fonts", "hugo"], "optimize");
});

// Compile CSS with PostCSS
gulp.task("css", () => (
  gulp.src("./src/css/*.css")
    .pipe(postcss([
      cssImport({from: "./src/css/main.css"}),
      nestedcss(),
      lostgrid(),
      cssvars({variables: styleVariables})]))
    .pipe(gulp.dest("./dist/css"))
    .pipe(browserSync.stream())
));

// Compile Javascript
gulp.task("js", (cb) => {
  const myConfig = Object.assign({}, webpackConfig);

  webpack(myConfig, (err, stats) => {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      colors: true,
      progress: true
    }));
    browserSync.reload();
    cb();
  });
});

// Move all fonts in a flattened directory
gulp.task('fonts', () => (
  gulp.src("./src/fonts/**/*")
    .pipe(flatten())
    .pipe(gulp.dest("./dist/fonts"))
    .pipe(browserSync.stream())
));

// Optimize all image assets
gulp.task("optimize", () => (
  // resize and compress images
   gulp.src(["dist/img/**/*.jpg", "dist/img/**/*.png"])
    .pipe($.responsive({
      '**/*.jpg': [{
        width: 1000,
      }, {
        width: 1000 * 2,
        rename: { suffix: '@2x' }
      }, {
        width: 1000 * 3,
        rename: { suffix: '@3x' }
      }],
      '**/*.png': [{
        width: 1000,
      }, {
        width: 1000 * 2,
        rename: { suffix: '@2x' }
      }, {
        width: 1000 * 3,
        rename: { suffix: '@3x' }
      }],
    }, {
      withoutEnlargement: true,
      skipOnEnlargement: false,
      errorOnEnlargement: false
    }))
    .pipe(imagemin([
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.optipng({
        optimizationLevel: 7
      })
    ]))
    .pipe(gulp.dest(DEST+"img"))
    .pipe(browserSync.stream()),

  gulp.src(["dist/img/**/*.svg", "dist/img/**/*.gif"])
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true,
        optimizationLevel: 3
      }),
      imagemin.svgo({plugins: [{
        removeViewBox: true
      }]})
    ]))
    .pipe(gulp.dest(DEST+"img"))
    .pipe(browserSync.stream()),

  gulp.src(["dist/img/favicon/**/*"])
    .pipe(gulp.dest(DEST+"img/favicon"))
    .pipe(browserSync.stream()),

  // add srcset to images
  gulp.src("dist/**/*.html")
    .pipe(imgSrcSet())
    .pipe(gulp.dest(DEST))
));

// Development server with browsersync
gulp.task("server", ["hugo", "css", "js", "fonts"], () => {
  browserSync.init({
    server: {
      baseDir: "./dist"
    },
    notify: false
  });
  gulp.watch("./src/js/**/*.js", ["js"]);
  gulp.watch("./src/css/**/*.css", ["css"]);
  gulp.watch("./src/fonts/**/*", ["fonts"]);
  gulp.watch("./site/**/*", ["hugo"]);
});

/**
 * Run hugo and build the site
 */
function buildSite(cb, options, environment = "development") {
  const args = options ? hugoArgsDefault.concat(options) : hugoArgsDefault;

  process.env.NODE_ENV = environment;

  return spawn(hugoBin, args, {stdio: "inherit"}).on("close", (code) => {
    if (code === 0) {
      browserSync.reload();
      cb();
    } else {
      browserSync.notify("Hugo build failed :(");
      cb("Hugo build failed");
    }
  });
}
