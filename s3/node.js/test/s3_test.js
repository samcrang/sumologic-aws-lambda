var assert = require('assert');
var nock = require('nock');
var sinon = require('sinon');
var AWS = require('aws-sdk-mock');
var s3_lambda = require('../s3.js');

describe('s3_lambda', function() {
  describe('handler', function() {
    it('should do something', function(done) {
      var http_mock = nock('https://www.example.com')
        .post("/hello", 'lol')
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

      AWS.mock('S3', 'getObject', new Buffer('lol'));

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
