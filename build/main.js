require('source-map-support/register')
module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* WEBPACK VAR INJECTION */(function(__dirname) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_koa__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_koa___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_koa__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_nuxt__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_nuxt___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_nuxt__);



const bodyParser = __webpack_require__(3);
const staticServer = __webpack_require__(4);
const upload = __webpack_require__(5);

async function start() {
  const app = new __WEBPACK_IMPORTED_MODULE_0_koa___default.a();
  const host = process.env.HOST || '127.0.0.1';
  const port = process.env.PORT || 3000;

  // Import and Set Nuxt.js options
  const config = __webpack_require__(10);
  config.dev = !(app.env === 'production');

  // Instantiate nuxt.js
  const nuxt = new __WEBPACK_IMPORTED_MODULE_1_nuxt__["Nuxt"](config);

  // Build in development
  if (config.dev) {
    const builder = new __WEBPACK_IMPORTED_MODULE_1_nuxt__["Builder"](nuxt);
    await builder.build();
  }

  app.use(staticServer(__dirname + '/public'));
  app.use(bodyParser());
  app.use(upload.routes(), upload.allowedMethods());

  app.use(ctx => {
    ctx.status = 200;
    ctx.respond = false; // Mark request as handled for Koa
    ctx.req.ctx = ctx; // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
    nuxt.render(ctx.req, ctx.res);
  });

  app.listen(port, host);
  console.log('Server listening on ' + host + ':' + port); // eslint-disable-line no-console
}

start();
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, "server"))

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("koa");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("nuxt");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("koa-bodyparser");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("koa-static");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__dirname) {const path = __webpack_require__(6),
      fse = __webpack_require__(7),
      router = __webpack_require__(8)(),
      multiparty = __webpack_require__(9),
      UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");

router.prefix('/upload');

const getSuffix = filename => filename.slice(filename.lastIndexOf('.'), filename.length);

const uploadFileChunk = request => {
  return new Promise(resolve => {
    let multipartyForm = new multiparty.Form();
    multipartyForm.parse(request, async (err, fields, files) => {
      if (err) return;

      const [chunk] = files.chunk;
      const [fileHash] = fields.fileHash;

      const chunkDir = `${UPLOAD_DIR}\\${fileHash.slice(0, fileHash.length - 2)}-tmp`;
      if (!fse.existsSync(chunkDir)) {
        await fse.mkdirs(chunkDir);
      }
      // fs-extra 专用方法，类似 fs.rename 并且跨平台
      // fs-extra 的 rename 方法 windows 平台会有权限问题
      fse.move(chunk.path, `${chunkDir}\\${fileHash}`, res => {
        resolve();
      });
    });
  });
};

router.post('/', async (ctx, next) => {
  await uploadFileChunk(ctx.req);

  ctx.body = {
    code: 0,
    message: '文件上传成功'
  };
});

const mergeFileChunk = async (filePath, fileHash) => {
  const chunkDir = `${UPLOAD_DIR}\\${fileHash}-tmp`;
  const chunkPaths = await fse.readdir(chunkDir);
  await fse.writeFile(filePath, '');
  chunkPaths.forEach(chunkPath => {
    fse.appendFileSync(filePath, fse.readFileSync(`${chunkDir}/${chunkPath}`));
    fse.unlinkSync(`${chunkDir}/${chunkPath}`);
  });
  fse.rmdirSync(chunkDir); // 合并后删除保存切片的目录
};

router.post('/merge', async (ctx, next) => {
  const { fileHash, filename } = ctx.request.body;
  const filePath = `${UPLOAD_DIR}\\${fileHash}${getSuffix(filename)}`;
  await mergeFileChunk(filePath, fileHash);

  ctx.body = {
    code: 0,
    message: '文件合并成功'
  };
});

const getUploadedList = async fileHash => {
  return fse.existsSync(`${UPLOAD_DIR}\\${fileHash}-tmp`) ? await fse.readdir(`${UPLOAD_DIR}\\${fileHash}-tmp`) : [];
};

router.post('/verify', async (ctx, next) => {
  const { fileHash, filename } = ctx.request.body;
  const filePath = `${UPLOAD_DIR}\\${fileHash}${getSuffix(filename)}`;

  let code = 0,
      message = '文件不存在';
  if (fse.existsSync(filePath)) {
    code = 1;
    message = '文件已存在';
  }

  ctx.body = {
    code: code,
    uploadedList: await getUploadedList(fileHash),
    message: message
  };
});

module.exports = router;
/* WEBPACK VAR INJECTION */}.call(exports, "server"))

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("fs-extra");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("koa-router");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("multiparty");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'starter',
    meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { hid: 'description', name: 'description', content: 'Nuxt.js project' }],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
  ** Global CSS
  */
  css: ['~assets/css/main.css', 'element-ui/lib/theme-chalk/index.css'],
  plugins: [{
    src: '~/plugins/element-ui',
    ssr: true
    //mode: 'server'
  }],
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#3B8070' },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** Run ESLINT on save
     */
    extend(config, ctx) {
      if (ctx.Client) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        });
      }
    }
  }
};

/***/ })
/******/ ]);
//# sourceMappingURL=main.map