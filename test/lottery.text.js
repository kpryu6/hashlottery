const Lottery = artifacts.require("Lottery");

// parameter deployer, user1, user2�� Accounts[0], Accounts[1], Accounts[2]�� �� ����
contract("Lottery", function ([deployer, user1, user2]) {
  let lottery;
  beforeEach(async () => {
    console.log("Before each");
    lottery = await Lottery.new();
  });

  it.only("getPot should return current pot", async () => {
    let pot = await lottery.getPot();
    assert.equal(pot, 0);
  });
});

/* let lottery
    lottery = await Lottery.new()
    // ���� ���� */

// migrations ������ �ִ� �͵��� test�� ���� ������ �ʴ´�. (���� �Ҽ��� ������ �ϴ�..)
// ���⼭ ������ ����Ʈ ��Ʈ��Ʈ�� �ϴ°� ����
