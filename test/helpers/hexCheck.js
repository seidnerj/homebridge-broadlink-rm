const { expect } = require('chai');

const hexCheck = ({ device, codes, count }) => {
  codes = codes || [];

  // Check hex codes were sent
  expect(device.sentHexCodes).to.include.members(codes);

  if (count !== undefined) {
    // Check the number of sent codes
    expect(device.sentHexCodes, `sent: ${device.sentHexCodes}`).to.have.lengthOf(count);
  }
}

module.exports = hexCheck;
