const { assert } = require('chai');
const uuid = require('uuid');
const fs = require('fs');
const findKey = require('find-key');

const delayForDuration = require('../helpers/delayForDuration');
const ServiceManagerTypes = require('../helpers/serviceManagerTypes');
const catchDelayCancelError = require('../helpers/catchDelayCancelError');
const { getDevice } = require('../helpers/getDevice');
const BroadlinkRMAccessory = require('./accessory');

const FanAccessory = require('./fan');

class HumidifierDehumidifierAccessory extends FanAccessory {
  
  constructor (log, config = {}, serviceManagerType) {
    super(log, config, serviceManagerType);

    this.humidityCallbackQueue = {};
    this.monitorHumidity();
  }

  setDefaults () {
    const { data, config, state } = this;
	  
	  super.setDefaults();
	
    // Set config default values
    config.humidifierOnly = config.humidifierOnly || false;
    config.deHumidifierOnly = config.deHumidifierOnly || false;
    config.humidityUpdateFrequency = config.humidityUpdateFrequency || 10;
    config.humidityAdjustment = config.humidityAdjustment || 0;
    config.noHumidity = config.noHumidity || false;
    config.threshold = config.threshold || 5;
    data.fanOnly = data.fanOnly ? data.fanOnly : data.off;

    state.firstHumidityUpdate = true;
  }

  reset () {
    super.reset();
  }
	
//  async setSwitchState (hexData, previousValue) {
//    super.setSwitchState(hexData, previousValue);
        
//    if (!state.switchState) {
//      log(`${name} updateCurrentState: changing to inactive`);
//      state.currentState = Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;
//    } 
//    serviceManager.refreshCharacteristicUI(Characteristic.CurrentHumidifierDehumidifierState);
//  }
  
  async setCurrentState (hexData, previousValue) {
      const { debug, data, config, log, name, state, serviceManager } = this;
    
      if (debug) log(`\x1b[34m[DEBUG]\x1b[0m ${name} setCurrentState: requested update from ${previousValue} to ${state.currentState}`);

      // Ignore if no change to the targetPosition
      if (state.currentState === previousValue) return;

      switch(state.currentState){
        case Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING:
          hexData = data.targetStateDehumidifier;
        case Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING:
          hexData = data.targetStateHumidifier;
        case Characteristic.CurrentHumidifierDehumidifierState.IDLE:
          hexData = data.fanOnly;
      }
    
      log(`${name} setCurrentState: currently ${previousValue}, changing to ${state.currentState}`);
	  
      if(hexData) await this.performSend(hexData);
      serviceManager.refreshCharacteristicUI(Characteristic.CurrentHumidifierDehumidifierState);
  }
  
  async setHumidifierThreshold (hexData, previousValue) {
    const { config, name, log, state } = this;
    if (state.HumidifierThreshold === previousValue && config.preventResendHex && !this.previouslyOff) return;
    this.previouslyOff = false;
    let desiredState = this.getDesiredState ();
    let previousState = state.currentState;
    
    if (state.currentState === desiredState) return;
    
    log(`${name} setHumidifierThreshold: currently ${previousValue} to ${state.DehumidifierThreshold}, changing to ${state.HumidifierThreshold} to ${state.DehumidifierThreshold}`);
    state.currentState = desiredState;
    this.setCurrentState (hexData, previousState);
  }
  
  async setDehumidifierThreshold (hexData, previousValue) {
    const { config, name, log, state } = this;
    if (state.DehumidifierThreshold === previousValue && config.preventResendHex && !this.previouslyOff) return;
    this.previouslyOff = false;
    let desiredState = this.getDesiredState ();
    let previousState = state.currentState;
    
    if (state.currentState === desiredState) return;
    
    log(`${name} setDeumidifierThreshold: currently ${state.HumidifierThreshold} to ${previousValue}, changing to ${state.HumidifierThreshold} to ${state.DehumidifierThreshold}`);
    state.currentState = desiredState;
    this.setCurrentState (hexData, previousState);
  }
  
  getDesiredState () {
    const { config, log, name, state, serviceManager } = this;
    
    let desiredState = Characteristic.CurrentHumidifierDehumidifierState.IDLE;

    //Work out the ideal state
    if (state.targetState === Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER_OR_DEHUMIDIFIER) {
      if ((state.currentHumidity > state.HumidifierThreshold) && (state.currentHumidity < state.DehumidifierThreshold)){
        desiredState = Characteristic.CurrentHumidifierDehumidifierState.IDLE;
      } else if (state.currentHumidity < state.HumidifierThreshold) {
        desiredState = Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING;
      } else if (state.currentHumidity > state.DehumidifierThreshold) {
        desiredState = Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;
      }
    } else if (state.targetState === Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER) {
      if(state.currentHumidity < state.HumidifierThreshold){
        desiredState = Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING;
      } 
    } else {
        //Must be set to Dehumidifier      
      if(state.currentHumidity > state.DehumidifierThreshold){
        desiredState = Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING;
      }
    } 

    if (config.humidifierOnly && desiredState === Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING) {
      desiredState = Characteristic.CurrentHumidifierDehumidifierState.IDLE;
    }
    if (config.deHumidifierOnly && desiredState === Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING) {
      desiredState = Characteristic.CurrentHumidifierDehumidifierState.IDLE;
    }

    return desiredState;  
	}
	
  async updateDeviceState () {
    const { debug, config, name, log, state } = this;
    
    //Do nothing if turned off
    if (state.switchState === false) {
      state.currentState = Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;
      serviceManager.refreshCharacteristicUI(Characteristic.CurrentHumidifierDehumidifierState);
      return;
    }
    
	  if (state.targetState === Characteristic.TargetHumidifierDehumidifierState.OFF){
      state.currentState = Characteristic.CurrentHumidifierDehumidifierState.INACTIVE;
      state.switchState = false;
    }
    
    let desiredState = this.getDesiredState ();
    
    if (state.currentState === desiredState) return;
    if (debug) log(`\x1b[34m[DEBUG]\x1b[0m ${name} updateDeviceState: currently ${state.currentState}, changing to ${desiredState}`);

    this.setCurrentState (null, null);
    state.currentState = desiredState;
  }

  // Device Temperature Methods
  async monitorHumidity () {
    const { debug, config, host, log, name, state } = this;

    const device = getDevice({ host, log });

    // Try again in a second if we don't have a device yet
    if (!device) {
      await delayForDuration(1);

      this.monitorHumidity();

      return;
    }

    if (debug) log(`\x1b[34m[DEBUG]\x1b[0m ${name} monitorHumidity`);

    //Broadlink module emits 'temperature for both sensors.
    device.on('temperature', this.onHumidity.bind(this));
    device.checkHumidity();

    this.updateHumidityUI();
    if (!config.isUnitTest && !config.noHumidity) setInterval(this.updateHumidityUI.bind(this), config.humidityUpdateFrequency * 1000)
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
    
    this.updateDeviceState()

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

    // Use hardcoded values if not using Humidity values 
    if(config.noHumidity){
      state.currentHumidity = 35
      state.targetHumidity = 5

      if (state.targetState === Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER) {
        state.currentHumidity = 5
        state.targetHumidity = 15
      } 

      this.processQueuedHumidityCallbacks(state.currentHumidity);
      return;
    }
    
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
    const { config, host, debug, log, name, state, serviceManager } = this;
    const { noHumidity } = config;

	  this.addHumidityCallbackToQueue(callback);
  }
 
  setupServiceManager () {
    const { config, data, name, serviceManagerType } = this;
    const {
      on,
      off,
      targetStateHumidifier,
      targetStateDehumidifier,
      lockControls,
      unlockControls,
      swingToggle
    } = data || {};

    // Defaults
    if (config.showLockPhysicalControls !== false) config.showLockPhysicalControls = true
    if (config.showSwingMode !== false && config.hideSwingMode !== true) config.showSwingMode = true
    if (config.showRotationDirection !== false && config.hideRotationDirection !== true) config.showRotationDirection = true

    this.serviceManager = new ServiceManagerTypes[serviceManagerType](name, Service.HumidifierDehumidifier, this.log);
    
    this.serviceManager.addToggleCharacteristic({
      name: 'switchState',
      type: Characteristic.Active,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: {
        onData: on,
        offData: off,
        setValuePromise: this.setSwitchState.bind(this)
      }
    });

    this.serviceManager.addGetCharacteristic({
      name: 'currentHumidity',
      type: Characteristic.CurrentRelativeHumidity,
      method: this.getCurrentHumidity,
      bind: this
    });
	
	  this.serviceManager.addToggleCharacteristic({
      name: 'HumidifierThreshold',
      type: Characteristic.RelativeHumidityHumidifierThreshold,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: {
        setValuePromise: this.setHumidifierThreshold.bind(this)
      }
	  });
	
	  this.serviceManager.addToggleCharacteristic({
      name: 'DehumidifierThreshold',
      type: Characteristic.RelativeHumidityDehumidifierThreshold,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: {
        setValuePromise: this.setDehumidifierThreshold.bind(this)
      }
	  });
		
    this.serviceManager.addToggleCharacteristic({
      name: 'currentState',
      type: Characteristic.CurrentHumidifierDehumidifierState,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: { }
    });
    
    this.serviceManager.addToggleCharacteristic({
      name: 'targetState',
      type: Characteristic.TargetHumidifierDehumidifierState,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: {
        setValuePromise: this.updateDeviceState.bind(this)
      }
    });
    
    if (config.humidifierOnly) {
	    this.serviceManager
    		.getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
		     	.setProps({
					  validValues: [1]
				});
				
	    this.serviceManager
    		.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
		    	.setProps({
					validValues: [0, 2]
				});
    }	
	 
 	  if (config.deHumidifierOnly) {
	    this.serviceManager
		    .getCharacteristic(Characteristic.TargetHumidifierDehumidifierState)
			    .setProps({
				    validValues: [2]
				});
				
	    this.serviceManager
		    .getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState)
			    .setProps({
				    validValues: [0, 3]
				});
	  }	

    if (config.showLockPhysicalControls) {
      this.serviceManager.addToggleCharacteristic({
        name: 'lockPhysicalControls',
        type: Characteristic.LockPhysicalControls,
        getMethod: this.getCharacteristicValue,
        setMethod: this.setCharacteristicValue,
        bind: this,
        props: {
          onData: lockControls,
          offData: unlockControls
        }
      });
    }

    if (config.showSwingMode) {
      this.serviceManager.addToggleCharacteristic({
        name: 'swingMode',
        type: Characteristic.SwingMode,
        getMethod: this.getCharacteristicValue,
        setMethod: this.setCharacteristicValue,
        bind: this,
        props: {
          onData: swingToggle,
          offData: swingToggle,
        }
      });
    }

    this.serviceManager.addToggleCharacteristic({
      name: 'fanSpeed',
      type: Characteristic.RotationSpeed,
      getMethod: this.getCharacteristicValue,
      setMethod: this.setCharacteristicValue,
      bind: this,
      props: {
        setValuePromise: this.setFanSpeed.bind(this)
      }
    });
  }
}

module.exports = HumidifierDehumidifierAccessory;
