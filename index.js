var SQSWorker = require('sqs-worker');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {

  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform("homebridge-platform-sqs", "SQS", SQSPlatform, true);
}

function SQSPlatform(log, config, api) {

  //just capture the input, we'll set it up in accessories
  this.log = log;
  this.config = config;
  this.api = api;
}

SQSPlatform.prototype = {
  accessories: function(callback) {
    //For each device in cfg, create an accessory!
    var foundAccessories = this.config.accessories;
    var myAccessories = [];

    for (var i = 0; i < foundAccessories.length; i++) {
      var accessory = new SQSAccessory(this.log, foundAccessories[i]);
      myAccessories.push(accessory);
      this.log('Created ' + accessory.name + ' Accessory');
    }
    callback(myAccessories);
  },
  removeAccessory: function(accessory) {
    if (accessory) {
      this.api.unregisterPlatformAccessories("homebridge-amazondash", "AmazonDash", [accessory]);
    }
  }
}


//an accessorary, eg a button. This one is mostly just an on/off state button.
//SQS message toggles it, as does pressing it in the home app
function SQSAccessory(log, accessory) {
  this.log = log;
  this.accessory = accessory;
  this.name = this.accessory.name;
  this.buttonIsOn = 0;
  this.startListener();
}

SQSAccessory.prototype = {
  startListener: function() {
    var self = this;

    //setup the SQS queue listener
    var options = {
      url: this.accessory.queueurl,
      region: this.accessory.region,
      accessKeyId: this.accessory.accesskey,
      secretAccessKey: this.accessory.secret,

      //eat the logging, make it goes out the Homebridge logging
      // mostly cos sqsworker is a bit noisy
      log: {
        info: function(a, b) {
          self.log(a + " " + b);
        },
        error: function(a, b) {
          self.log("err:" + a + " " + b);
        }
      }
    };

    //setup the queue.
    this.queue = new SQSWorker(options, function(event, done) {
      if (self.accessory.verbose) {
        self.log(event);
      }


      self.toggleButton();

      //report back to SQS that we are done - otherwise it'll resubmit the message
      var success = true;

      // Call `done` when you are done processing a message.
      // If everything went successfully and you don't want to see it any more,
      // set the second parameter to `true`.
      done(null, success);
    });

    //we should start by purging the queue, 'cos you dont want a load of state changes
    //coming in on startup
    this.queue.client.purgeQueue({
      QueueUrl: options.url
    }, function(err, data) {
      if (err) {
        self.log(err);
      }
      self.log("Purged the queue");
    });

  },

  toggleButton: function() {
    //toggle the internal state of the button
    this.buttonIsOn = this.buttonIsOn == 0 ? 1 : 0;
    this.log(`${this.name}: SQS Button state change. New state is ${this.buttonIsOn}`);
    this.service.getCharacteristic(Characteristic.On).setValue(this.buttonIsOn);
  },

  identify: function(callback) {
    this.log("[" + this.name + "] Identify requested!");
    callback(); // success
  },

  getServices: function() {
    //get the services this accessory supports
    //this is were we setup the button, but if it was, eg, a fan, you'd make a fan here.

    var services = [];

    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'AmazonSQS');

    var switchService = new Service.Switch(this.accessory.name);
    switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getSPState.bind(this))
      .on('set', this.setSPState.bind(this));

    informationService
      .setCharacteristic(Characteristic.Model, 'QueueButton')
      .setCharacteristic(Characteristic.SerialNumber, '1.0');

    services.push(switchService, informationService);

    //keep the service, so we can turn it on/off later.
    this.service = switchService;

    return services;
  },

  getSPState: function(callback) {
    //homekit calling into us to get the state
    this.log(`${this.name}: Get State: ${this.buttonIsOn}`);
    callback(null, this.buttonIsOn);
  },

  setSPState: function(state, callback) {
    this.buttonIsOn = state;
    //homekit calling into us to set the state. state is 1 or 0
    //if (state) {
    //  this.buttonIsOn = true;
    //} else {
    //  this.buttonIsOn = false;
    //}
    this.log(`${this.name}: Set State to ${this.buttonIsOn}`);
    callback(null, this.buttonIsOn);

  }
}
