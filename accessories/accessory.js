const uuid = require('uuid');

const { HomebridgeAccessory } = require('../base');

const sendData = require('../helpers/sendData');
const delayForDuration = require('../helpers/delayForDuration');
const catchDelayCancelError = require('../helpers/catchDelayCancelError');

class BroadlinkRMAccessory extends HomebridgeAccessory {

  constructor (log, config = {}, serviceManagerType) {
    if (!config.name) config.name = "Unknown Accessory"

    config.resendDataAfterReload = config.resendHexAfterReload;
    if (config.host) {
      //Clean up MAC address formatting
      config.host = config.host.toLowerCase();
      if (!config.host.includes(".") && !config.host.includes(":") && config.host.length === 12){
        config.host = config.host.match(/[\s\S]{1,2}/g).join(':');
      }
    }

    super(log, config, serviceManagerType);
    if (config.debug) this.debug = true

    this.manufacturer = 'Broadlink';
    this.model = 'RM Mini or Pro';
    this.serialNumber = uuid.v4();

    //Set LogLevel
    switch(this.config.logLevel){
      case 'none':
        this.logLevel = 6;
        break;
      case 'critical':
        this.logLevel = 5;
        break;
      case 'error':
        this.logLevel = 4;
        break;
      case 'warning':
        this.logLevel = 3;
        break;
      default:
      //case 'info':
        this.logLevel = 2;
        break;
      case 'debug':
        this.logLevel = 1;
        break;
      case 'trace':
        this.logLevel = 0;
        break;
    }
    if(this.config.debug) {this.logLevel = Math.min(1, this.logLevel);}
    if(this.config.disableLogs) {this.logLevel = 6;}  
  }

  performSetValueAction ({ host, data, log, name, debug }) {
    sendData({ host, hexData: data, log, name, debug });
  }
  
  reset () {
    // Clear Multi-hex timeouts
    if (this.intervalTimeoutPromise) {
      this.intervalTimeoutPromise.cancel();
      this.intervalTimeoutPromise = null;
    }

    if (this.pauseTimeoutPromise) {
      this.pauseTimeoutPromise.cancel();
      this.pauseTimeoutPromise = null;
    }
  }

  async performSend (data, actionCallback) {
    const { debug, config, host, log, name } = this;

    if (typeof data === 'string') {
      sendData({ host, hexData: data, log, name, debug });

      return;
    }

    await catchDelayCancelError(async () => {
      // Itterate through each hex config in the array
      for (let index = 0; index < data.length; index++) {
        const { pause } = data[index];

        await this.performRepeatSend(data[index], actionCallback);

        if (pause) {
          this.pauseTimeoutPromise = delayForDuration(pause);
          await this.pauseTimeoutPromise;
        }
      }
    });
  }

  async performRepeatSend (parentData, actionCallback) {
    const { host, log, name, debug } = this;
    let { data, interval, sendCount } = parentData;

    sendCount = sendCount || 1
    if (sendCount > 1) interval = interval || 0.1;

    // Itterate through each hex config in the array
    for (let index = 0; index < sendCount; index++) {
      sendData({ host, hexData: data, log, name, debug });

      if (interval && index < sendCount - 1) {
        this.intervalTimeoutPromise = delayForDuration(interval);
        await this.intervalTimeoutPromise;
      }
    }
  }
}

module.exports = BroadlinkRMAccessory;
