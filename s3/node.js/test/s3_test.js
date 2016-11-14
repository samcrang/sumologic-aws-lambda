var subject = require('../s3'),
  AWS = require('aws-sdk-mock'),
  assert = require('assert'),
  nock = require('nock');

var fake_s3_object_created_event = {
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

var fake_log = "#Version: 1.0\n#Fields: date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem sc-status cs(Referer) cs(User-Agent) cs-uri-query cs(Cookie) x-edge-result-type x-edge-request-id x-host-header cs-protocol cs-bytes time-taken x-forwarded-for ssl-protocol ssl-cipher x-edge-response-result-type\n2016-02-09  12:31:48  SEA32 398 10.0.123.456  HEAD  fake-distribution.cloudfront.net  / 200 - Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36  - - Hit MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==  www.example.com https 369 0.002 - TLSv1.2 ECDHE-RSA-AES128-GCM-SHA256 Hit\n2016-02-09  12:31:48  SEA32 444 10.0.123.456  HEAD  fake-distribution.cloudfront.net  /something  200 - Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36  - - Hit MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==  www.example.com https 376 0.001 - TLSv1.2 ECDHE-RSA-AES128-GCM-SHA256 Hit\n";

var fake_sumologic_preamble = "Bucket: fake-log-bucket ObjectKey: fake-log-file\n";

var fake_context = function(assertions, done) {
  return {
    succeed: function() {
      assertions();
      done();
    },
    fail: function (err) {
      assertions();
      done(err);
    }
  }
};

describe("s3", function() {
  describe("happy path", function() {
    it("should send logs to sumologic", function(done) {
      var http_mock = nock('https://endpoint1.collection.sumologic.com')
        .post("/receiver/v1/http/<XXXX>", fake_sumologic_preamble + fake_log)
        .reply(200);

      AWS.mock("S3", "getObject", new Buffer(fake_log));

      subject.handler(fake_s3_object_created_event, fake_context(function(err) {
        assert.equal(err, undefined);
        http_mock.done();
      }, done));
    });
  });
});
