const Lottery = artifacts.require("Lottery");

// parameter deployer, user1, user2는 Accounts[0], Accounts[1], Accounts[2]에 각 매핑
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
    // 배포 과정 */

// migrations 폴더에 있는 것들은 test할 때는 사용되지 않는다. (연계 할수도 있지만 일단..)
// 여기서 배포한 스마트 컨트랙트로 하는게 좋다
