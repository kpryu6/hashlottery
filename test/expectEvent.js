const assert = require("chai").assert;

//lottery.text.js���� console.log(receipt) �ؼ������� log���� eventName ã�°�

const inLogs = async (logs, eventName) => {
  const event = logs.find((e) => e.event === eventName);
  assert.exists(event);
};

module.exports = {
  inLogs,
};
