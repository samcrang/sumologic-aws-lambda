var subject = require('../s3'),
  AWS = require('aws-sdk-mock'),
  assert = require('assert'),
  nock = require('nock'),
  fake_context = require('./helpers/fake-context'),
  TEST_DATA = require('./helpers/test-data');

describe("Sumologic S3 CloudFront Lambda", function() {
  describe(".handler", function() {
    afterEach(function() {
      nock.cleanAll();
      AWS.restore("S3");
    });

    it("should send compressed logs to sumologic", function(done) {
      var http_mock = nock('https://endpoint1.collection.sumologic.com')
        .post("/receiver/v1/http/<XXXX>", TEST_DATA.compressed.sumologic_preamble + TEST_DATA.uncompressed.cloudfront_logs)
        .reply(200);

      AWS.mock("S3", "getObject", new Buffer(TEST_DATA.compressed.cloudfront_logs));

      subject.handler(TEST_DATA.compressed.lambda_event, fake_context(function(err) {
        assert.equal(err, undefined);
        http_mock.done();
      }, done));
    });

    it("should send logs to sumologic", function(done) {
      var http_mock = nock('https://endpoint1.collection.sumologic.com')
        .post("/receiver/v1/http/<XXXX>", TEST_DATA.uncompressed.sumologic_preamble + TEST_DATA.uncompressed.cloudfront_logs)
        .reply(200);

      AWS.mock("S3", "getObject", new Buffer(TEST_DATA.uncompressed.cloudfront_logs));

      subject.handler(TEST_DATA.uncompressed.lambda_event, fake_context(function(err) {
        assert.equal(err, undefined);
        http_mock.done();
      }, done));
    });
  });
});
