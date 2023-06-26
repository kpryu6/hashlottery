const Lottery = artifacts.require("Lottery");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");

// parameter deployer, user1, user2는 Accounts[0], Accounts[1], Accounts[2]에 각 매핑
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

  describe("isMatch", function () {
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

  describe("Distribute", function () {
    describe("When the answer is checkable", function () {
      it("should give the user the pot when the answer matches", async () => {
        // 두 글자 다 맞혔을 때
        await lottery.setAnswerforTest(
          "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 1 -> block 4에 배팅
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 2 -> 5
        await lottery.betAndDistribute("0xab", {
          from: user1,
          value: betAmount,
        }); // block 3 -> 6 ((정답 맞추는 블록) -> 7번 블록에서 확인가능)
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

        // 여기까지 block 1,2 번 결과는 앎
        let potBefore = await lottery.getPot(); // 1,2번 틀렸으니까 여기 쌓일거임 (0.01 ETH 있어야함)
        let user1BalanceBefore = await web3.eth.getBalance(user1); // user1의 pot 받기전 balance
        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 7 -> 10 // user1에게 pot money가 간다.

        let potAfter = await lottery.getPot(); // 3번 블록이 정답 맞추고 pot 상태보기 (0 ETH 있어야함)
        let user1BalanceAfter = await web3.eth.getBalance(user1); // user1의 pot 받은 후 balance (before + 0.01 ETH + 0.005ETH(자신이 베팅한거))

        // pot의 변화량 확인 (potBefore와 After가 모두 BN으로 오기 때문에 BN으로 처리)
        assert.equal(
          potBefore.toString(),
          new web3.utils.BN("10000000000000000").toString()
        );
        assert.equal(potAfter.toString(), new web3.utils.BN("0").toString());

        // user(winner)의 밸런스를 확인
        user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
        assert.equal(
          user1BalanceBefore.add(potBefore).add(betAmountBN).toString(),
          new web3.utils.BN(user1BalanceAfter).toString()
        );
      });

      it("should give the user the amount when a single char matches", async () => {
        // 한 글자 다 맞혔을 때
        await lottery.setAnswerforTest(
          "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 1 -> block 4에 배팅
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 2 -> 5
        await lottery.betAndDistribute("0xaf", {
          from: user1,
          value: betAmount,
        }); // block 3 -> 6 ((정답 맞추는 블록) -> 7번 블록에서 확인가능)
        await lottery.betAndDistribute("0xef", {
          // 한글자만 맞춤
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

        // 여기까지 block 1,2 번 결과는 앎
        let potBefore = await lottery.getPot(); // 1,2번 틀렸으니까 여기 쌓일거임 (0.01 ETH 있어야함)
        let user1BalanceBefore = await web3.eth.getBalance(user1); // user1의 pot 받기전 balance
        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 7 -> 10 // user1에게 pot money가 간다.

        let potAfter = await lottery.getPot(); // 3번 블록이 한글자만 맞추고 pot 상태보기 (0.01 ETH 있어야함 == potBefore)
        let user1BalanceAfter = await web3.eth.getBalance(user1); // user1의 pot 받은 후 balance (before + 0.005ETH(자신이 베팅한거))

        // pot의 변화량 확인 (potBefore와 After가 모두 BN으로 오기 때문에 BN으로 처리)
        assert.equal(potBefore.toString(), potAfter.toString());

        // user(winner)의 밸런스를 확인
        user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
        assert.equal(
          user1BalanceBefore.add(betAmountBN).toString(),
          new web3.utils.BN(user1BalanceAfter).toString()
        );
      });

      it.only("should give the user the pot when the answer does not match at all", async () => {
        // 두 글자 다 틀렸을 때
        await lottery.setAnswerforTest(
          "0xab2bd97559f56324cf0ae225291ddd657fdb300b8994b299b891d29465a58e11",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 1 -> block 4에 배팅
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 2 -> 5
        await lottery.betAndDistribute("0xef", {
          from: user1,
          value: betAmount,
        }); // block 3 -> 6 ((정답 맞추는 블록) -> 7번 블록에서 확인가능)
        await lottery.betAndDistribute("0xef", {
          // 한글자만 맞춤
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

        // 여기까지 block 1,2 번 결과는 앎
        let potBefore = await lottery.getPot(); // 1,2번 틀렸으니까 여기 쌓일거임 (0.01 ETH 있어야함)
        let user1BalanceBefore = await web3.eth.getBalance(user1); // user1의 pot 받기전 balance
        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // block 7 -> 10 // user1에게 pot money가 간다.

        let potAfter = await lottery.getPot(); // 3번 블록이 못맞추고 pot 상태보기 (0.015 ETH 있어야함)
        let user1BalanceAfter = await web3.eth.getBalance(user1); // user1의 pot 받은 후 balance (before + 0.005ETH(자신이 베팅한거))

        // pot의 변화량 확인 (potBefore와 After가 모두 BN으로 오기 때문에 BN으로 처리)
        assert.equal(
          potBefore.add(betAmountBN).toString(),
          potAfter.toString()
        );

        // user(winner)의 밸런스를 확인
        user1BalanceBefore = new web3.utils.BN(user1BalanceBefore);
        assert.equal(
          user1BalanceBefore.toString(),
          new web3.utils.BN(user1BalanceAfter).toString()
        );
      });
    });

    describe("When the answer is not revealed (Not Mined)", function () {
      // 해보기
    });

    describe("When the answer is not revealed (Block limit is passed)", function () {
      // 해보기
    });
  });
});

/* let lottery
    lottery = await Lottery.new()
    // 배포 과정 */

// migrations 폴더에 있는 것들은 test할 때는 사용되지 않는다. (연계 할수도 있지만 일단..)
// 여기서 배포한 스마트 컨트랙트로 하는게 좋다
