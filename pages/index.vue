<template>
  <section class="container">
    <el-upload action="" :show-file-list="false" :http-request="handleUpload" style="display: inline-block;">
      <el-button type="primary">上传文件</el-button>
    </el-upload>
    <el-button @click="stopUpload">{{ stopBtnTxt }}</el-button>

    <div v-if="fileChunkList.length" class="progress-box">
      <div class="chunk" v-for="chunk in fileChunkList" :key="chunk.hash">
        <span>{{ chunk.hash }}</span>
        <div class="bar">
          <el-progress :percentage="+(chunk.percentage * 100).toFixed(0)"></el-progress>
        </div>
        <span>{{ (chunk.total / 1024).toFixed(1) }}KB</span>
      </div>
    </div>
  </section>
</template>

<script>
import axios from 'axios'
import request from '@/utils/request'

const CUT_LENGTH = 10 // 切片数量

export default {
  data() {
    return {
      file: null,
      fileHash: '',
      fileChunkList: [],
      requestList: [],
      cancelToken: axios.CancelToken,
      stopBtnStatus: false
    }
  },
  computed: {
    stopBtnTxt() {
      return this.stopBtnStatus ? '继续' : '暂停'
    }
  },
  methods: {
    // 处理文件上传
    async handleUpload(option) {
      this.file = option.file
      if (!this.file) return

      this.fileHash = await this.createMD5(this.file)

      let { code } = await this.verifyFile()
      if (code !== 0) {
        this.$message.success('秒传成功')
        return
      }

      const fileChunkList = this.createFileChunk(this.file)

      this.fileChunkList = fileChunkList.map(({ file }, index) => {
        return {
          fileHash: this.fileHash + '-' + index,
          chunk: file,
          hash: this.file.name + '-' + index,
          total: 0,
          loaded: 0,
          percentage: 0
        }
      })

      this.uploadChunks()
    },
    // 文件切片
    createFileChunk(file, length = CUT_LENGTH) {
      const fileChunkList = []
      const chunkSize = Math.ceil(file.size / length)

      let cur = 0
      while (cur < file.size) {
        fileChunkList.push({
          file: file.slice(cur, cur + chunkSize)
        })
        cur += chunkSize
      }
      return fileChunkList
    },
    // 文件上传
    async uploadChunks() {
      const requestList = this.fileChunkList.map(({chunk, hash, fileHash}) => {
        let formData = new FormData()
        formData.append('chunk', chunk)
        formData.append('hash', hash)
        formData.append('fileHash', fileHash)
        formData.append('filename', this.file.name)
        return formData
      }).map((formData, index) => {
        let source = this.cancelToken.source()
        this.requestList.push(source)
        return request({
          url: '/upload',
          method: 'POST',
          data: formData,
          cancelToken: source.token,
          onUploadProgress: progress => {
            this.fileChunkList[index].total = progress.total
            this.fileChunkList[index].loaded = progress.loaded
            this.fileChunkList[index].percentage = progress.loaded / progress.total
          }
        }).then(res => {
          this.requestList.splice(index, 1)
        })
      })

      await Promise.all(requestList)

      this.mergeRequest()
    },
    // 文件合并
    mergeRequest() {
      return request({
        url: '/upload/merge',
        method: 'POST',
        data: {
          fileHash: this.fileHash,
          filename: this.file.name
        }
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('上传成功')
        }
      })
    },
    // 验证文件是否存在
    verifyFile() {
      return new Promise(resolve => {
        return request({
          url: '/upload/verify',
          method: 'POST',
          data: {
            fileHash: this.fileHash,
            filename: this.file.name
          }
        }).then(res => {
          resolve(res)
        })
      })
    },
    // 生成MD5
    createMD5(file) {
      return new Promise((resolve) => {
        let worker = new Worker('/index.js')
        worker.postMessage({ file })
        worker.onmessage = e => {
          const { md5 } = e.data
          resolve(md5)
        }
      })
    },
    // 暂停上传文件
    async stopUpload() {
      if (!this.stopBtnStatus) {
        this.requestList.map(request => {
          request.cancel()
        })
      } else {
        let { uploadedList } = await this.verifyFile()
        this.fileChunkList = this.fileChunkList.filter(chunk => {
          return !uploadedList.includes(chunk.fileHash)
        })

        this.uploadChunks()
      }

      this.stopBtnStatus = !this.stopBtnStatus
    }
  }
}
</script>

<style scoped>
.el-button {
  margin-bottom: 20px;
}
.progress-box {
  margin: 0 auto;
  width: 600px;
}
.chunk {
  display: flex;
  margin-top: 10px;
}
.bar {
  flex: 1;
  margin: 0 10px;
}
</style>
