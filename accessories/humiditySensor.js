const { assert } = require('chai');
const uuid = require('uuid');
const fs = require('fs');
const findKey = require('find-key');

const delayForDuration = require('../helpers/delayForDuration');
const ServiceManagerTypes = require('../helpers/serviceManagerTypes');
const catchDelayCancelError = require('../helpers/catchDelayCancelError');
const { getDevice } = require('../helpers/getDevice');
const HumidifierAccessory = require('./humidifier-dehumidifier');

class HumiditySensorAccessory extends HumidifierAccessory {

  constructor (log, config = {}, serviceManagerType) {
    super(log, config, serviceManagerType);
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

  //Method inhertied but not required
  async updateDeviceState () { return;}
  
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
