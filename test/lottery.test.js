const Lottery = artifacts.require("Lottery");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");

// parameter deployer, user1, user2�� Accounts[0], Accounts[1], Accounts[2]�� �� ����
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
      // compile�� ���� �����鼭 Not enough ETH��� ���� �޽����� ����.

      // fail�� ������ ��� ĳġ�� ���ΰ�?? => Open zepplin
      // assertRevert�� lottery.bet�� ���� ������ try catch�� ��Ƽ�
      // revert��� ���ڸ� ����ִ��� Ȯ���غ��� ��������� ����� fail �� ���� ĳġ�ߴ�!! ��°��� Ȯ��
      await assertRevert(
        lottery.bet("0xab", { from: user1, value: 4 * 10 ** 15 })
      );
      // transaction object {chainId(ü�α���), value(�̴���), to(������ �ּ�), from(��), gas(Limit), gasPrice}
    });

    it("should put the bet to the bet queue with 1 bet", async () => {
      // bet
      let receipt = await lottery.bet("0xab", {
        from: user1,
        value: 5 * 10 ** 15,
      });

      //console.log(receipt);

      // ó���� 0
      // assert.equal�� Ȯ���ϴ°�
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
      "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11"; // �ƹ� hash �� �ܼ� �׽�Ʈ��

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
    // ���� ���� */

// migrations ������ �ִ� �͵��� test�� ���� ������ �ʴ´�. (���� �Ҽ��� ������ �ϴ�..)
// ���⼭ ������ ����Ʈ ��Ʈ��Ʈ�� �ϴ°� ����
