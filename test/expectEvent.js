const assert = require("chai").assert;

//lottery.text.js에서 console.log(receipt) 해서나오는 log에서 eventName 찾는거

const inLogs = async (logs, eventName) => {
  const event = logs.find((e) => e.event === eventName);
  assert.exists(event);
};

module.exports = {
  inLogs,
};
