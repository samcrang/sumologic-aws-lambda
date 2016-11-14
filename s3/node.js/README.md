# Cloudfront to Sumologic Lamdbda function

## Testing

There are some (not very good) unit tests. You can invoke them with:

  npm test

You can manually invoke the lambda task and check the logs end up in Sumologic. You will need to tweak the bucket and object location in `test/example/event.json` as well as making sure the correct Sumoligic endpoint is used in `s3.js`. You can then execute this:

  lambda-local -l s3.js -h handler -e test/example/event.json -t 20  
