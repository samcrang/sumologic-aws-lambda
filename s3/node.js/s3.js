var AWS = require('aws-sdk'),
    https = require('https'),
    zlib = require('zlib');

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Remember to change the hostname and path to match your collection API and specific HTTP-source endpoint
// See more at: https://service.sumologic.com/help/Default.htm#Collector_Management_API.htm
///////////////////////////////////////////////////////////////////////////////////////////////////////////

var options = {
    'hostname': 'endpoint1.collection.sumologic.com',
    'path': "/receiver/v1/http/<XXXX>",
    'method': 'POST'
};

function s3LogsToSumo(bucket, objKey, context, s3) {
    var req = https.request(options, function(res) {
        var body = '';
        console.log('Status:', res.statusCode);
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

    if (!isCompressed) {
        s3Stream.on('data', function(data) {
            finalData += data;
            req.write(data + '\n');
            totalBytes += data.length;
        });
        s3Stream.on('end', finishFnc);
    } else {
        var gunzip = zlib.createGunzip();
        s3Stream.pipe(gunzip);

        gunzip.on('data', function(data) {
            totalBytes += data.length;
            req.write(data.toString() + '\n');
            finalData += data.toString();
        });
        gunzip.on('end', finishFnc);
        gunzip.on('error', function(error) {
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
