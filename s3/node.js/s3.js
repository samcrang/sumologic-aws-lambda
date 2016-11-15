var AWS = require('aws-sdk'),
    https = require('https'),
    zlib = require('zlib'),
    byline = require('byline'),
    LineStream = require('byline').LineStream,
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

function anonymizeIp(field) {
    var consumer_ip = ip.toBuffer(field);
    consumer_ip[2] = "0";
    consumer_ip[3] = "0";
    return ip.toString(consumer_ip);
}

function anonymizeXForwardedFor(field) {
    return "-";
}

function anonymize(line) {
    var s = line.toString();
    if (s[0] === "#") {
        return line;
    }

    var fields = s.split('\t');

    fields[4] = anonymizeIp(fields[4]);
    fields[19] = anonymizeXForwardedFor(fields[19]);

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
        res.on('error', function(err) {
            console.log(err);
        });
    });

    var totalLines = 0;

    var s3Stream = s3.getObject({ Bucket: bucket, Key: objKey }).createReadStream();
    s3Stream.on('error', function(error) {
        context.fail(error);
    });

    req.write('Bucket: ' + bucket + ' ObjectKey: ' + objKey + '\n');

    var isCompressed = !!objKey.match(/\.gz$/);
    if (isCompressed) {
        s3Stream = s3Stream.pipe(zlib.createGunzip());
    }

    s3Stream
        .pipe(new LineStream())
        .on('data', function(data) {
            totalLines++;
            req.write(anonymize(data) + '\n');
        })
        .on('end', function() {
            console.log("End of stream");
            console.log("Log lines processed: " + totalLines);
            req.end();
            context.succeed();
        })
        .on('error', function(error) {
            context.fail(error);
        });
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
