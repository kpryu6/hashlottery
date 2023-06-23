module.exports = async (promise) => {
  try {
    await promise;
    assert.fail("Expected revert not received");
  } catch (error) {
    // error catch
    // search를 걸어주면 index 나옴(?)
    const revertFound = error.message.search("revert") >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
};
