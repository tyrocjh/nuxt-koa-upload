self.importScripts("/spark-md5.min.js");

self.addEventListener('message', function (e) {
  let { file } = e.data
  
  let fileReader = new FileReader()
  let spark = new self.SparkMD5()
  fileReader.readAsBinaryString(file)

  fileReader.onload = (e) => {
    spark.appendBinary(e.target.result)
    const md5 = spark.end()
    self.postMessage({ md5 })
    self.close()
  }
}, false)
