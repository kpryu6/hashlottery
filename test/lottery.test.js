const Lottery = artifacts.require("Lottery");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");

// parameter deployer, user1, user2는 Accounts[0], Accounts[1], Accounts[2]에 각 매핑
contract("Lottery", function ([deployer, user1, user2]) {
  let lottery;
  let betAmount = 5 * 10 ** 15;
  let bet_block_interval = 3;

  // lottery
  beforeEach(async () => {
    lottery = await Lottery.new();
  });

  it("getPot should return current pot", async () => {
    let pot = await lottery.getPot();
    assert.equal(pot, 0);
  });

  describe("Bet", function () {
    it("should fail when the bet money is not 0.005 ETH", async () => {
      // Fail transaction
      // compile이 되지 않으면서 Not enough ETH라고 에러 메시지가 나옴.

      // fail이 났을때 어떻게 캐치할 것인가?? => Open zepplin
      // assertRevert가 lottery.bet이 던진 에러를 try catch로 잡아서
      // revert라는 글자를 들어있는지 확인해보고 들어있으면 제대로 fail 된 것을 캐치했다!! 라는것을 확인
      await assertRevert(
        lottery.bet("0xab", { from: user1, value: 4 * 10 ** 15 })
      );
      // transaction object {chainId(체인구별), value(이더값), to(목적지 주소), from(나), gas(Limit), gasPrice}
    });

    it("should put the bet to the bet queue with 1 bet", async () => {
      // bet
      let receipt = await lottery.bet("0xab", {
        from: user1,
        value: 5 * 10 ** 15,
      });

      //console.log(receipt);

      // 처음엔 0
      // assert.equal로 확인하는거
      let pot = await lottery.getPot();
      assert.equal(pot, 0);

      // check contract balance == 0.005
      let contractBalance = await web3.eth.getBalance(lottery.address);
      assert.equal(contractBalance, betAmount);

      // check bet info
      let currentBlockNumber = await web3.eth.getBlockNumber();
      let bet = await lottery.getBetInfo(0);

      assert.equal(
        bet.answerBlockNumber,
        currentBlockNumber + bet_block_interval
      );
      assert.equal(bet.bettor, user1);
      assert.equal(bet.challenges, "0xab");

      // log

      //console.log(receipt);

      await expectEvent.inLogs(receipt.logs, "BET");
    });
  });

  describe.only("isMatch", function () {
    let blockHash =
      "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11"; // 아무 hash 값 단순 테스트용

    it("should be BettingResult.Win when 2 characters match appropriately", async () => {
      let matchingResult = await lottery.isMatch("0xab", blockHash);
      assert.equal(matchingResult, 0); // 0 = Win
    });

    it("should be BettingResult.Fail when 2 characters match appropriately", async () => {
      let matchingResult = await lottery.isMatch("0xcd", blockHash);
      assert.equal(matchingResult, 1); // 1 = Fail
    });

    it("should be BettingResult.Draw when 2 characters match appropriately", async () => {
      let matchingResult = await lottery.isMatch("0xac", blockHash);
      assert.equal(matchingResult, 2); // 2 = Draw

      matchingResult = await lottery.isMatch("0xfb", blockHash);
      assert.equal(matchingResult, 2); // 2 = Draw
    });
  });
});

/* let lottery
    lottery = await Lottery.new()
    // 배포 과정 */

// migrations 폴더에 있는 것들은 test할 때는 사용되지 않는다. (연계 할수도 있지만 일단..)
// 여기서 배포한 스마트 컨트랙트로 하는게 좋다
