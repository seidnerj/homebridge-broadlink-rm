const { expect } = require('chai');

const { addDevice, retryAuthenticationUntilReady } = require('../helpers/getDevice');

// A minimal stand-in for the broadlink library's Device object. Only the fields
// retryAuthenticationUntilReady touches are present.
const makeDevice = (address) => ({
  host: { address, macAddress: address },
  authenticateCount: 0,
  authenticate () { this.authenticateCount++; }
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const noop = () => {};
const FAST = 5; // ms retry interval for tests

describe('retryAuthenticationUntilReady', () => {

  it('does nothing for values that are not authenticatable devices', () => {
    // The library stores 'Not Supported'/null for unusable devices.
    expect(() => retryAuthenticationUntilReady(undefined, noop, 6, FAST)).to.not.throw();
    expect(() => retryAuthenticationUntilReady(null, noop, 6, FAST)).to.not.throw();
    expect(() => retryAuthenticationUntilReady('Not Supported', noop, 6, FAST)).to.not.throw();
    expect(() => retryAuthenticationUntilReady({ host: { address: 'x' } }, noop, 6, FAST)).to.not.throw();
  });

  it('does not re-authenticate a device that is already registered', async () => {
    const device = makeDevice('test-already-ready');
    addDevice(device); // simulate a successful initial discovery

    retryAuthenticationUntilReady(device, noop, 6, FAST);
    await wait(40);

    expect(device.authenticateCount).to.equal(0);
  });

  it('retries authenticate() until the device registers, then stops', async () => {
    const device = makeDevice('test-eventually-ready');

    // Simulate the handshake succeeding on the 2nd retry: a real success would
    // emit deviceReady, whose handler calls addDevice — do that here directly.
    device.authenticate = function () {
      this.authenticateCount++;
      if (this.authenticateCount === 2) { addDevice(this); }
    };

    retryAuthenticationUntilReady(device, noop, 6, FAST);
    await wait(80);

    // Stopped as soon as it registered; no further authenticate() calls.
    expect(device.authenticateCount).to.equal(2);
  });

  it('keeps retrying while the device stays unreachable', async () => {
    const device = makeDevice('test-never-ready');

    const interval = retryAuthenticationUntilReady(device, noop, 6, FAST);
    await wait(50);
    clearInterval(interval); // stop the loop so it doesn't leak past the test

    // ~10 ticks in 50ms at a 5ms interval; assert it kept trying (no one-shot).
    expect(device.authenticateCount).to.be.greaterThan(3);
  });
});
