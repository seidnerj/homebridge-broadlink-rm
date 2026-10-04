const { expect } = require('chai');

const { getAccessories } = require('./helpers/setup')

const log = () => {
  return null
}

// disableLogs
describe('disableLogs', () => {

  it('disableLogs true returns empty function', async () => {
    const config = {
      isUnitTest: true,
      hideScanFrequencyButton: true,
      disableLogs: true,
      hideLearnButton: true,
      accessories: [
        {
          name: 'Test',
          type: 'switch',
          disableLogs: true
        }
      ]
    };
  
    const accessories = await getAccessories(config, log);

    const logFunctionAsString = accessories[0].log.toString();
    // Normalize whitespace: the disabled-log no-op stringifies as "() => { }" on
    // some engines and "() => {}" on others; compare structure, not exact spacing.
    const isEmptyFunction = logFunctionAsString.replace(/\s/g, '') === '()=>{}';
    
    expect(isEmptyFunction).to.equal(true);
  });

  it('disableLogs false returns useful function', async () => {
    const config = {
      isUnitTest: true,
      hideScanFrequencyButton: true,
      hideLearnButton: true,
      accessories: [
        {
          name: 'Test',
          type: 'switch',
        }
      ]
    };

    const accessories = await getAccessories(config, log);
  
    const logFunctionAsString = accessories[0].log.toString();
    // Normalize whitespace: the disabled-log no-op stringifies as "() => { }" on
    // some engines and "() => {}" on others; compare structure, not exact spacing.
    const isEmptyFunction = logFunctionAsString.replace(/\s/g, '') === '()=>{}';

    expect(isEmptyFunction).to.equal(false);
  });
})
