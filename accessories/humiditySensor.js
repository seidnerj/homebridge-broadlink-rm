const { assert } = require('chai');
const uuid = require('uuid');
const fs = require('fs');
const findKey = require('find-key');

const delayForDuration = require('../helpers/delayForDuration');
const ServiceManagerTypes = require('../helpers/serviceManagerTypes');
const catchDelayCancelError = require('../helpers/catchDelayCancelError');
const { getDevice } = require('../helpers/getDevice');
const BroadlinkRMAccessory = require('./accessory');

class HumiditySensorAccessory extends BroadlinkRMAccessory {

  constructor (log, config = {}, serviceManagerType) {
    super(log, config, serviceManagerType);

    this.humidityCallbackQueue = {};
    this.monitorHumidity();
  }

  setDefaults () {
    const { config, state } = this;

    // Set config default values
    config.humidityUpdateFrequency = config.humidityUpdateFrequency || 10;
    config.humidityAdjustment = config.humidityAdjustment || 0;

    state.firstHumidityUpdate = true;
  }

  reset () {
    super.reset();
  }

  // Device Temperature Methods
  async monitorHumidity () {
    const { config, host, log, name, state } = this;

    const device = getDevice({ host, log });

    // Try again in a second if we don't have a device yet
    if (!device) {
      await delayForDuration(1);

      this.monitorHumidity();

      return;
    }

    log(`${name} monitorHumidity`);

    //Broadlink module emits 'temperature for both sensors.
    device.on('temperature', this.onHumidity.bind(this));
    device.checkHumidity();

    this.updateHumidityUI();
    if (!config.isUnitTest) setInterval(this.updateHumidityUI.bind(this), config.humidityUpdateFrequency * 1000)
  }

  onHumidity (temperature,humidity) {
    const { config, host, log, name, state } = this;
    const { humidityAdjustment } = config;

    // onHumidity is getting called twice. No known cause currently.
    // This helps prevent the same humidity from being processed twice
    if (Object.keys(this.humidityCallbackQueue).length === 0) return;

    humidity += humidityAdjustment;
    state.currentHumidity = humidity;
    log(`${name} onHumidity (` + humidity + `)`);

    this.processQueuedHumidityCallbacks(humidity);
  }

  addHumidityCallbackToQueue (callback) {
    const { config, host, debug, log, name, state } = this;
    
    // Clear the previous callback
    if (Object.keys(this.humidityCallbackQueue).length > 1) {
      if (state.currentHumidity) {
        if (debug) log(`\x1b[34m[DEBUG]\x1b[0m ${name} addHumidityCallbackToQueue (clearing previous callback, using existing humidity)`);

        this.processQueuedHumidityCallbacks(state.currentHumidity);
      }
    }

    // Add a new callback
    const callbackIdentifier = uuid.v4();
    this.humidityCallbackQueue[callbackIdentifier] = callback;

    // Read temperature from Broadlink RM device
    // If the device is no longer available, use previous tempeature
    const device = getDevice({ host, log });

    if (!device || device.state === 'inactive') {
      if (device && device.state === 'inactive') {
        log(`${name} addHumidityCallbackToQueue (device no longer active, using existing humidity)`);
      }

      this.processQueuedHumidityCallbacks(state.currentHumidity || 0);

      return;
    }

    device.checkHumidity();
    if (debug) log(`\x1b[34m[DEBUG]\x1b[0m ${name} addHumidityCallbackToQueue (requested humidity from device, waiting)`);
  }

  processQueuedHumidityCallbacks (humidity) {
    if (Object.keys(this.humidityCallbackQueue).length === 0) return;

    Object.keys(this.humidityCallbackQueue).forEach((callbackIdentifier) => {
      const callback = this.humidityCallbackQueue[callbackIdentifier];

      callback(null, humidity);
      delete this.humidityCallbackQueue[callbackIdentifier];
    })

    this.humidityCallbackQueue = {};
  }

  updateHumidityUI () {
    const { config, serviceManager } = this;

    serviceManager.refreshCharacteristicUI(Characteristic.CurrentRelativeHumidity);
  }

  getCurrentHumidity (callback) {
    const { config, host, debug, log, name, state } = this;
    const { pseudoDeviceTemperature } = config;

    this.addHumidityCallbackToQueue(callback);
  }
  
  // Service Manager Setup

  setupServiceManager () {
    const { config, name, serviceManagerType } = this;

    this.serviceManager = new ServiceManagerTypes[serviceManagerType](name, Service.HumiditySensor, this.log);

    this.serviceManager.addGetCharacteristic({
      name: 'currentHumidity',
      type: Characteristic.CurrentRelativeHumidity,
      method: this.getCurrentHumidity,
      bind: this
    });
  }
}

module.exports = HumiditySensorAccessory
