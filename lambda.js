//you need to provide an environment variable called queueUrl which is
// the full url of your SQS queueUrl

//This lambda's role also needs to be able to send to that queue.

'use strict';

const AWS = require('aws-sdk');

// Your queue URL stored in the queueUrl environment variable
const QUEUE_URL = process.env.queueUrl;


exports.handler = (event, context, callback) => {
  //console.log('Received event:', event);

  //adjust region as needed
  var sqs = new AWS.SQS({
    region: 'us-west-2'
  });

  var msg = {
    button_pressed: true,
    buttonEvent: event
  };

  var sqsParams = {
    MessageBody: JSON.stringify(msg),
    QueueUrl: QUEUE_URL
  };

  sqs.sendMessage(sqsParams, function(err, data) {
    if (err) {
      console.log('ERR', err);
      callback(err, "oops");

    }

    console.log(data);
    callback(null, "ok");

  });
};
