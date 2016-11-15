var AWS = require('aws-sdk'),
    https = require('https'),
    zlib = require('zlib'),
    byline = require('byline'),
    ip = require('ip');

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Remember to change the hostname and path to match your collection API and specific HTTP-source endpoint
// See more at: https://service.sumologic.com/help/Default.htm#Collector_Management_API.htm
///////////////////////////////////////////////////////////////////////////////////////////////////////////

var options = {
    'hostname': 'endpoint1.collection.sumologic.com',
    'path': "/receiver/v1/http/<XXXX>",
    'method': 'POST'
};

function anonymize(line) {
  var s = line.toString();

  if (s[0] === "#")
    return line;

  var fields = s.split('\t');
  var consumer_ip = ip.toBuffer(fields[4]);
  consumer_ip[2] = "0";
  consumer_ip[3] = "0";

  fields[4] = ip.toString(consumer_ip);
  fields[19] = "-";

  return fields.join('\t');
}

function s3LogsToSumo(bucket, objKey, context, s3) {
    var req = https.request(options, function(res) {
        var body = '';
        console.log('Status: ', res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function(chunk) { body += chunk; });
        res.on('end', function() {
            console.log('Successfully processed HTTPS response');
        });
    });

    var finalData = '';
    var totalBytes = 0;
    var isCompressed = false;
    if (objKey.match(/\.gz$/)) {
        isCompressed = true;
    }

    var finishFnc = function() {
        console.log("End of stream");
        console.log("Final total byte read: "+totalBytes);
        req.end();
        context.succeed();
    };

    var s3Stream = s3.getObject({ Bucket: bucket, Key: objKey }).createReadStream();
    s3Stream.on('error', function() {
        console.log(
            'Error getting object "' + objKey + '" from bucket "' + bucket + '".  ' +
                'Make sure they exist and your bucket is in the same region as this function.');
        context.fail();
    });

    req.write('Bucket: '+ bucket + ' ObjectKey: ' + objKey + '\n');

    var lineStream;
    if (!isCompressed) {
        lineStream = byline.createStream(s3Stream);
        lineStream.on('data', function(data) {
            finalData += data;
            req.write(anonymize(data) + '\n');
            totalBytes += data.length;
        });
        lineStream.on('end', finishFnc);
    } else {
        var gunzip = zlib.createGunzip();
        lineStream = byline.createStream(s3Stream.pipe(gunzip));

        lineStream.on('data', function(data) {
            totalBytes += data.length;
            req.write(anonymize(data).toString() + '\n');
            finalData += data.toString();
        });
        lineStream.on('end', finishFnc);
        lineStream.on('error', function(error) {
            context.fail(error);
        });
    }
}

exports.handler = function(event, context) {
    var s3 = new AWS.S3();

    options.agent = new https.Agent(options);
    event.Records.forEach(function(record) {
        var bucket = record.s3.bucket.name;
        var objKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        console.log('Bucket: ' + bucket + ' ObjectKey: ' + objKey);
        s3LogsToSumo(bucket, objKey, context, s3);
    });
};
