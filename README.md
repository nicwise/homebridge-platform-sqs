# homebridge-platform-sqs
Hombridge platform for Amazon SQS, esp Dash Buttons

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

You will need an IAM profile for that users which includes the following at minimum:

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
I think you only NEED `sqs:ReceiveMessage`, `sqs:DeleteMessage` and `sqs:PurgeMessage` really.
