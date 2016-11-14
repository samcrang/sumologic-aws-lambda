var fs = require('fs');

module.exports = {
  uncompressed: {
    sumologic_preamble: "Bucket: fake-log-bucket ObjectKey: fake-log-file\n",
    cloudfront_logs: fs.readFileSync("test/fixtures/cloudfront-logs-uncompressed.log"),
    lambda_event: {
      Records: [{
        s3: {
          bucket: {
            name: "fake-log-bucket"
          },
          object: {
            key: "fake-log-file"
          }
        }
      }]
    }
  },
  compressed: {
    sumologic_preamble: "Bucket: fake-log-bucket ObjectKey: fake-log-file.gz\n",
    cloudfront_logs: fs.readFileSync("test/fixtures/cloudfront-logs-compressed.gz"),
    lambda_event: {
      Records: [{
        s3: {
          bucket: {
            name: "fake-log-bucket"
          },
          object: {
            key: "fake-log-file.gz"
          }
        }
      }]
    }
  }
};
