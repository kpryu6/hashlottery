const Lottery = artifacts.require("Lottery");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");

// parameter deployer, user1, user2�� Accounts[0], Accounts[1], Accounts[2]�� �� ����
contract("Lottery", function ([deployer, user1, user2]) {
  let lottery;
  let betAmount = 5 * 10 ** 15;
  let betAmountBN = new web3.utils.BN("5000000000000000"); // web3.util.BN Library
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

  describe("isMatch", function () {
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

  describe("Distribute", function () {
    describe("When the answer is checkable", function () {
      it("should give the user the pot when the answer matches", async () => {
        // �� ���� �� ������ ��
        await lottery.setAnswerforTest(
          "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 1 -> block 4�� ����
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 2 -> 5
        await lottery.betAndDistribute("0xab", {
          from: user1,
          value: betAmount,
        }); // block 3 -> 6 ((���� ���ߴ� ���) -> 7�� ��Ͽ��� Ȯ�ΰ���)
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 4 -> 7
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 5 -> 8
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 6 -> 9

        // ������� block 1,2 �� ����� ��
        let potBefore = await lottery.getPot(); // 1,2�� Ʋ�����ϱ� ���� ���ϰ��� (0.01 ETH �־����)
        let user1BalanceBefore = await web3.eth.getBalance(user1); // user1�� pot �ޱ��� balance
        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 7 -> 10 // user1���� pot money�� ����.

        let potAfter = await lottery.getPot(); // 3�� ����� ���� ���߰� pot ���º��� (0 ETH �־����)
        let user1BalanceAfter = await web3.eth.getBalance(user1); // user1�� pot ���� �� balance (before + 0.01 ETH + 0.005ETH(�ڽ��� �����Ѱ�))

        // pot�� ��ȭ�� Ȯ�� (potBefore�� After�� ��� BN���� ���� ������ BN���� ó��)
        assert.equal(
          potBefore.toString(),
          new web3.utils.BN("10000000000000000").toString()
        );
        assert.equal(potAfter.toString(), new web3.utils.BN("0").toString());

        // user(winner)�� �뷱���� Ȯ��
        user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
        assert.equal(
          user1BalanceBefore.add(potBefore).add(betAmountBN).toString(),
          new web3.utils.BN(user1BalanceAfter).toString()
        );
      });

      it("should give the user the amount when a single char matches", async () => {
        // �� ���� �� ������ ��
        await lottery.setAnswerforTest(
          "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 1 -> block 4�� ����
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 2 -> 5
        await lottery.betAndDistribute("0xaf", {
          from: user1,
          value: betAmount,
        }); // block 3 -> 6 ((���� ���ߴ� ���) -> 7�� ��Ͽ��� Ȯ�ΰ���)
        await lottery.betAndDistribute("0xef", {
          // �ѱ��ڸ� ����
          from: user2,
          value: betAmount,
        }); // block 4 -> 7
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 5 -> 8
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 6 -> 9

        // ������� block 1,2 �� ����� ��
        let potBefore = await lottery.getPot(); // 1,2�� Ʋ�����ϱ� ���� ���ϰ��� (0.01 ETH �־����)
        let user1BalanceBefore = await web3.eth.getBalance(user1); // user1�� pot �ޱ��� balance
        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 7 -> 10 // user1���� pot money�� ����.

        let potAfter = await lottery.getPot(); // 3�� ����� �ѱ��ڸ� ���߰� pot ���º��� (0.01 ETH �־���� == potBefore)
        let user1BalanceAfter = await web3.eth.getBalance(user1); // user1�� pot ���� �� balance (before + 0.005ETH(�ڽ��� �����Ѱ�))

        // pot�� ��ȭ�� Ȯ�� (potBefore�� After�� ��� BN���� ���� ������ BN���� ó��)
        assert.equal(potBefore.toString(), potAfter.toString());

        // user(winner)�� �뷱���� Ȯ��
        user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
        assert.equal(
          user1BalanceBefore.add(betAmountBN).toString(),
          new web3.utils.BN(user1BalanceAfter).toString()
        );
      });

      it.only("should give the user the pot when the answer does not match at all", async () => {
        // �� ���� �� Ʋ���� ��
        await lottery.setAnswerforTest(
          "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 1 -> block 4�� ����
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 2 -> 5
        await lottery.betAndDistribute("0xef", {
          from: user1,
          value: betAmount,
        }); // block 3 -> 6 ((���� ���ߴ� ���) -> 7�� ��Ͽ��� Ȯ�ΰ���)
        await lottery.betAndDistribute("0xef", {
          // �ѱ��ڸ� ����
          from: user2,
          value: betAmount,
        }); // block 4 -> 7
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 5 -> 8
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 6 -> 9

        // ������� block 1,2 �� ����� ��
        let potBefore = await lottery.getPot(); // 1,2�� Ʋ�����ϱ� ���� ���ϰ��� (0.01 ETH �־����)
        let user1BalanceBefore = await web3.eth.getBalance(user1); // user1�� pot �ޱ��� balance
        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 7 -> 10 // user1���� pot money�� ����.

        let potAfter = await lottery.getPot(); // 3�� ����� �����߰� pot ���º��� (0.015 ETH �־����)
        let user1BalanceAfter = await web3.eth.getBalance(user1); // user1�� pot ���� �� balance (before + 0.005ETH(�ڽ��� �����Ѱ�))

        // pot�� ��ȭ�� Ȯ�� (potBefore�� After�� ��� BN���� ���� ������ BN���� ó��)
        assert.equal(
          potBefore.add(betAmountBN).toString(),
          potAfter.toString()
        );

        // user(winner)�� �뷱���� Ȯ��
        user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
        assert.equal(
          user1BalanceBefore.toString(),
          new web3.utils.BN(user1BalanceAfter).toString()
        );
      });
    });

    describe("When the answer is not revealed (Not Mined)", function () {
      // �غ���
    });

    describe("When the answer is not revealed (Block limit is passed)", function () {
      // �غ���
    });
  });
});

/* let lottery
    lottery = await Lottery.new()
    // ���� ���� */

// migrations ������ �ִ� �͵��� test�� ���� ������ �ʴ´�. (���� �Ҽ��� ������ �ϴ�..)
// ���⼭ ������ ����Ʈ ��Ʈ��Ʈ�� �ϴ°� ����
