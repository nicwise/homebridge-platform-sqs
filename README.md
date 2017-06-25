# homebridge-platform-sqs
Hombridge platform for Amazon SQS, esp Dash Buttons. [Full blogpost about it](https://fastchicken.co.nz/2017/06/25/more-homebridge-aws-iot-dash-button-sqs-broadlink-rm3-mini/)

# My setup

I have homebridge running on a Mac Mini on my local network, controlling 4 WeMo
switches (lights, heaters, coffee machine) and 2 IR senders to control the Heat Pump.

I also have a Dash Button.

I used the default Dash Button app on the appstore to setup the button, and have it create a basic Lambda, which normally just sends an SMS. I changed that lambda to write to an SQS queue.

# Installing

```
npm install -g https://github.com/nicwise/homebridge-platform-sqs.git
```

Might be coming to NPM sometime soon. Maybe.

# Config

Look in `config-sample.json`, but you want to add a new platform, called `SQS`

```
"platforms": [
    {
      "platform": "SQS",
      "name": "SQS",
      "accessories": [
        {
          "name": "Dash Button",
          "queueurl": "https://sqs.us-west-2.amazonaws.com/accountid/sqsqueuename",
          "accesskey": "AWSACCESSKEY",
          "secret": "AWSACCESSSECRET",
          "region": "us-west-2"
        }
      ]
    }
  ]
```

You need to name it (which shows in Homekit/Home.app), give it the queue URL you got from AWS,
and the accesskey and secret for the user you want to have the queue use. And the AWS region it's in.

# AWS setup

This is mostly for using it with a Dash Button, but it can be used with anything
which will write to an SQS queue.

You will need to setup the SQS queue, and have something write to it, eg a Lambda
(lambda included in here).

You should make an API-only user (eg `sqs.reader`) in IAM, which has the following IAM policy applied to them:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt19987",
            "Effect": "Allow",
            "Action": [
                "sqs:GetQueueAttributes",
                "sqs:ListQueues",
                "sqs:ReceiveMessage",
                "sqs:SendMessage",
                "sqs:DeleteMessage",
                "sqs:PurgeQueue"
            ],
            "Resource": [
                "arn:aws:sqs:<the rest of the URN of your queue>"
            ]
        }
    ]
}
```
> I think you only NEED `sqs:ReceiveMessage`, `sqs:DeleteMessage` and `sqs:PurgeMessage` really. To send the SQS message, the role the lambda is in needs `sqs:SendMessage`

From this user, you can get the accesskey and secret, which goes into the config,
along with the URL and region.

> NOTE: treat the accesskey and secret as a username/password - keep it safe.

You can test the queue by right clicking on it in the console and sending a message.
Personally, I use a Dash Button to connect to AWS IOT, which then invokes a Lambda
function, which sends an SQS message, which lands in here and turns lights on using
the automations in HomeKit (you may need an AppleTV or iPad for that)
