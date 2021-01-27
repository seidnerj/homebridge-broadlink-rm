const { getDevice } = require('./getDevice');

let closeClient = null;
let isClosingClient = false;
let timeout = null;
let getDataTimeout = null;
let getDataTimeout2 = null;
let getDataTimeout3 = null;
let foundFrequency = false;

let currentDevice

const stop = (log, device) => {
  // Reset existing learn requests
  if (!closeClient || isClosingClient) return;

  isClosingClient = true;

  if (currentDevice) currentDevice.cancelLearn();

  setTimeout(() => {
    closeClient();
    closeClient = null;
    isClosingClient = false;

    if (log) log(`\x1b[35m[INFO]\x1b[0m Scan RF (stopped)`);
  }, 500)
}

const start = (host, callback, turnOffCallback, log, disableTimeout) => {
  stop()

  // Get the Broadlink device
  const device = getDevice({ host, log, learnOnly: true })
  if (!device) {
    return log(`\x1b[35m[INFO]\x1b[0m Learn Code (Couldn't learn code, device not found)`);
  }

  if (!device.enterLearning) return log(`\x1b[31m[ERROR]\x1b[0m Learn Code (IR/RF learning not supported for device at ${host})`);
  if (!device.enterRFSweep) return log(`\x1b[31m[ERROR]\x1b[0m Scan RF (RF learning not supported for device (${device.type}) at ${host})`);

  currentDevice = device

  let onRawData;
  let onRawData2;
  let onRawData3;

  closeClient = (err) => {
    if (timeout) clearTimeout(timeout);
    timeout = null;

    if (getDataTimeout) clearTimeout(getDataTimeout);
    getDataTimeout = null;

    if (getDataTimeout2) clearTimeout(getDataTimeout2);
    getDataTimeout2 = null;

    if (getDataTimeout3) clearTimeout(getDataTimeout3);
    getDataTimeout3 = null;


    device.removeListener('rawRFData', onRawData);
    device.removeListener('rawRFData2', onRawData2);
    device.removeListener('rawData', onRawData3);
  };

  onRawData = (message) => {
    if (!closeClient) return;

    if (device.type === 0x279d || device.type === 0x27a9) {
      return device.enterLearning();
    }
  };

  onRawData2 = (message) => {
    if (!closeClient) return;
    
    foundFrequency = true;
  };

  onRawData3 = (message) => {
    if (!closeClient) return;

    const hex = message.toString('hex');
    log(`\x1b[35m[INFO]\x1b[0m Scan RF (complete)`);
    log(`\x1b[35m[RESULT]\x1b[0m Hex Code: ${hex}`);

    device.cancelLearn();

    closeClient();

    turnOffCallback();
  };

  device.on('rawRFData', onRawData);
  device.on('rawRFData2', onRawData2);
  device.on('rawData', onRawData3);

  device.enterRFSweep();
  log(`\x1b[35m[INFO]\x1b[0m Scan RF (scanning)`);
  log(`\x1b[35m[ACTION]\x1b[0m Hold down the button that sends the RF frequency.`);

  if (callback) callback();

  getDataTimeout = setTimeout(() => {
    getData(device);
  }, 1000);

  if (disableTimeout) return;

  // Scan frequencies for 10 seconds 
  timeout = setTimeout(() => {
    // After the scan getData2 confirms a frequency was found    
    clearTimeout(getDataTimeout);
    getDataTimeout2 = setTimeout(() => {
      getData2(device);
      getDataTimeout3 = setTimeout(() => {
        //After the frequency is found, scan for the code
        if(foundFrequency){
          log(`\x1b[35m[INFO]\x1b[0m Frequency found. To complete learning, single press the button you want to learn.`);
          getData3(device);

          setTimeout(() => {
            // Cancel after 5 seconds if nothing found    
            log(`\x1b[35m[INFO]\x1b[0m Code not found. Please try again.`);
            device.cancelLearn();
            closeClient();
            turnOffCallback();
          }, 5000); //5 seconds to 
        }else{
          log(`\x1b[35m[INFO]\x1b[0m Frequency could not be identified. Please try again.`);
          device.cancelLearn();
          closeClient();
          turnOffCallback();
        }
      }, 3000); // 3 seconds to confirm Frequency found
    }, 1000);
  }, 10 * 1000); //Frequency Scan for 10 seconds
}

const getData = (device) => {
  if (getDataTimeout) clearTimeout(getDataTimeout);
  if (!closeClient) return;

  device.checkRFData();

  //Retry every second
  getDataTimeout = setTimeout(() => {
    getData(device);
  }, 1000);
}

const getData2 = (device) => {
  if (getDataTimeout2) clearTimeout(getDataTimeout2);
  if (!closeClient) return;

  device.checkRFData2();
}

const getData3 = (device) => {
  if (getDataTimeout3) clearTimeout(getDataTimeout3);
  if (!closeClient) return;

  device.checkData()

  //Retry every second
  getDataTimeout3 = setTimeout(() => {
    getData3(device);
  }, 1000);
}

module.exports = { start, stop }
