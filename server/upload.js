const path = require("path"),
      fse = require("fs-extra"),
      router = require('koa-router')(),
      multiparty = require('multiparty'),
      UPLOAD_DIR = path.resolve(__dirname, "..", "uploads")

router.prefix('/upload')

const getSuffix = filename => filename.slice(filename.lastIndexOf('.'), filename.length)

const uploadFileChunk = (request) => {
  return new Promise((resolve) => {
    let multipartyForm = new multiparty.Form()
    multipartyForm.parse(request, async (err, fields, files) => {
      if (err) return
 
      const [chunk] = files.chunk
      const [fileHash] = fields.fileHash
  
      const chunkDir = `${UPLOAD_DIR}\\${fileHash.slice(0, fileHash.length - 2)}-tmp`
      if (!fse.existsSync(chunkDir)) {
        await fse.mkdirs(chunkDir)
      }
      // fs-extra 专用方法，类似 fs.rename 并且跨平台
      // fs-extra 的 rename 方法 windows 平台会有权限问题
      fse.move(chunk.path, `${chunkDir}\\${fileHash}`, res => {
        resolve()
      })
    })
  })
}

router.post('/', async (ctx, next) => {
  await uploadFileChunk(ctx.req)

  ctx.body = {
    code: 0,
    message: '文件上传成功'
  }
})

const mergeFileChunk = async (filePath, fileHash) => {
  const chunkDir = `${UPLOAD_DIR}\\${fileHash}-tmp`
  const chunkPaths = await fse.readdir(chunkDir)
  await fse.writeFile(filePath, '')
  chunkPaths.forEach(chunkPath => {
    fse.appendFileSync(filePath, fse.readFileSync(`${chunkDir}/${chunkPath}`));
    fse.unlinkSync(`${chunkDir}/${chunkPath}`);
  })
  fse.rmdirSync(chunkDir); // 合并后删除保存切片的目录
}

router.post('/merge', async (ctx, next) => {
  const { fileHash, filename } = ctx.request.body
  const filePath = `${UPLOAD_DIR}\\${fileHash}${getSuffix(filename)}`
  await mergeFileChunk(filePath, fileHash)

  ctx.body = {
    code: 0,
    message: '文件合并成功'
  }
})

const getUploadedList = async fileHash => {
  return fse.existsSync(`${UPLOAD_DIR}\\${fileHash}-tmp`) ? await fse.readdir(`${UPLOAD_DIR}\\${fileHash}-tmp`) : []
}

router.post('/verify', async (ctx, next) => {
  const { fileHash, filename } = ctx.request.body
  const filePath = `${UPLOAD_DIR}\\${fileHash}${getSuffix(filename)}`

  let code = 0, message = '文件不存在'
  if (fse.existsSync(filePath)) {
    code = 1
    message = '文件已存在'
  }

  ctx.body = {
    code: code,
    uploadedList: await getUploadedList(fileHash),
    message: message
  }
})

module.exports = router
