var assert = require('assert');
var nock = require('nock');
var sinon = require('sinon');
var AWS = require('aws-sdk-mock');
var s3_lambda = require('../s3.js');

var log = "#Version: 1.0\n#Fields: date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem sc-status cs(Referer) cs(User-Agent) cs-uri-query cs(Cookie) x-edge-result-type x-edge-request-id x-host-header cs-protocol cs-bytes time-taken x-forwarded-for ssl-protocol ssl-cipher x-edge-response-result-type\n2016-02-09  12:31:48  SEA32 398 10.0.123.456  HEAD  fake-distribution.cloudfront.net  / 200 - Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36  - - Hit MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==  www.example.com https 369 0.002 - TLSv1.2 ECDHE-RSA-AES128-GCM-SHA256 Hit\n2016-02-09  12:31:48  SEA32 444 10.0.123.456  HEAD  fake-distribution.cloudfront.net  /something  200 - Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36  - - Hit MRVMF7KydIvxMWfJIglgwHQwZsbG2IhRJ07sn9AkKUFSHS9EXAMPLE==  www.example.com https 376 0.001 - TLSv1.2 ECDHE-RSA-AES128-GCM-SHA256 Hit\n"

describe('s3_lambda', function() {
  describe('handler', function() {
    it('should do something', function(done) {
      var http_mock = nock('https://www.example.com')
        .post("/hello", log)
        .reply(200);

      var cb = function(assertions) {
        return {
          succeeded: function() {
            assertions();
            done();
          },
          fail: function (err) {
            assertions();
            done(err);
          }
        }
      };

      AWS.mock('S3', 'getObject', new Buffer(log));

      var stub = {bucket: "some-bucket", key: "some-key"};

      s3_lambda.handler(stub, cb(function(err) {
        http_mock.done();
      }));
    });
  });
});

describe('True', function() {
  it('should be true', function() {
    assert.equal(true, true);
  });
});
