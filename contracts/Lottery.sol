// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Lottery{

    // answer Block
    
    struct BetInfo {
        uint256 answerBlockNumber;
        // payable 적어줘야 transfer 가능
        address payable bettor;
        bytes1 challenges; //0xab
    }

    // QUEUE
    uint256 private _tail;
    uint256 private _head;
    mapping (uint256 => BetInfo) private _bets;

    // ??
    address public owner;
    
    // BLOCK HASH로 확인할 수 있는 제한 256
    uint256 constant internal BLOCK_LIMIT = 256;

    // 3번 블락에 배팅을 하게 되면 6번 블럭에 배팅을 하게 된다
    uint256 constant internal BET_BLOCK_INTERVAL = 3;

    // 베팅하는 금액 0.005ETH // 1ETH = 10 ** 18
    uint256 constant internal BET_AMOUNT = 5 * 10 ** 15;

    // pot money ??
    uint256 private _pot;


    // BlockStatus Enum
    enum BlockStatus { Checkable, NotRevealed, BlockLimitPassed}

    // 매칭 결과 Enum
    enum BettingResult { Win, Fail, Draw}

    // EVENT
    event BET(uint256 index, address bettor, uint256 amount, bytes1 challenges, uint answerBlockNumber); // emit 자체 375gas + 파라미터 하나 당 375 gas + 파라미터 저장 될때 byte당 8gas => 4~5000 gas 

    // Constructor
    constructor() public {
        owner = msg.sender;
    }



    // getter : smart contract? ?? ??? ???? view
    function getPot() public view returns (uint256 pot){
        return _pot;
    }

    //Bet

    /*
    * @dev 베팅을 한다. 유저는 0.005ETH를 보내야하고, 베팅용 1 byte 글자를 보낸다.
    * 큐에 저장된 베팅 정보는 이후 distribute 함수에서 해결된다.
    * @param challenges 유저가 베팅하는 글자
    * @return 함수가 잘 수행되었는지 확인하는 bool 값
    */
    
    function bet(bytes1 challenges) public payable returns (bool result) {

        // Check the proper ether is sent 
        // Not enough ETH
        require(msg.value == BET_AMOUNT, "Not enough ETH");

        // Push bet to the queue
        require(pushBet(challenges), "Fail to add a new Bet Info");

        // Emit event
        emit BET(_tail -1, msg.sender, msg.value, challenges, block.number + BET_BLOCK_INTERVAL);
        return true;

    }
    

    //Distribute 검증
    function distribute() public {
        // head 3 4 5 ... 11 12 tail
        uint256 cur;
        BetInfo memory b;
        BlockStatus currentBlockStatus;

        for (cur = _head; cur < _tail; cur++) {

            // BetInfo 불러오기
            b = _bets[cur];
            currentBlockStatus = getBlockStatus(b.answerBlockNumber);

            // Checkable : (block.number > answerBlockNumber) && (block.number < BLOCK_LIMIT + answerBlockNumber) (현재 블록보다 256 전까지만 확인할 수 있다 이게무슨말이지?)
            if (currentBlockStatus == BlockStatus.Checkable) {
                // if win , bettor가 pot money 가져감

                // if fail, bettor의 돈이 pot으로 감

                // if draw (한글자만 맞춘 경우), refund bettor's money
            }
            
            // block이 mining 되지 않은 상태(not revealed) : block.number <= answerBlockNumber // 등호가 붙은 이유 : 만들어지는 상태이므로 block.number 확인 불가
            if (currentBlockStatus == BlockStatus.NotRevealed) {
                break;
            }

            // block limit passed (지났을떄) : block.number >= BLOCK_LIMIT + answerBlockNumber
            if (currentBlockStatus == BlockStatus.BlockLimitPassed) {
                // refund
                // emit refund
            }

            popBet(cur);


        

        }
    }

    /*
    * @dev 베팅글자와 정답을 확인한다.
    * @param challenges 베팅 글자
    * @param answer 블록 해쉬
    * @return 정답결과
    */
    function isMatch(bytes1 challenges, bytes32 answer) public pure returns (BettingResult) {

        // challenges 0xab = 1010 1011
        // answer 0xab......ff 32bytes

        bytes1 c1 = challenges;
        bytes1 c2 = challenges;

        bytes1 a1 = answer[0];
        bytes1 a2 = answer[0];

        // Get first number // challenges
        c1 = c1 >> 4; // 1010 1011 -> 0000 1010 // c1 = 0x0a
        c1 = c1 << 4; // 0000 1010 -> 1010 0000 // c1 = 0xa0

        // Get first number // answer[0]
        a1 = a1 >> 4;
        a1 = a1 << 4;

        // Get second number // challenges
        c2 = c2 << 4; // 1010 1011 -> 1011 0000 // c2 = 0xb0
        c2 = c2 >> 4; // 1011 0000 -> 0000 1011 // c2 = 0x0b

        // Get second number // answer[0]
        a2 = a2 << 4;
        a2 = a2 >> 4;

        if (a1 == c1 && a2 == c2) {
            return BettingResult.Win;
        }

        else if (a1 == c1 || a2 == c2) {
            return BettingResult.Draw;
        }

        else return BettingResult.Fail;
    }
        // Block 상태
        function getBlockStatus(uint256 answerBlockNumber) internal view returns (BlockStatus) {
            if (block.number > answerBlockNumber && block.number < BLOCK_LIMIT + answerBlockNumber) {
                return BlockStatus.Checkable;
            }
            else if (block.number <= answerBlockNumber) {
                return BlockStatus.NotRevealed;
            }
            else if (block.number >= BLOCK_LIMIT + answerBlockNumber) {
                return BlockStatus.BlockLimitPassed;
            }
            else return BlockStatus.BlockLimitPassed;
        }



    // _bets ? ?? ?? ???? getter
    function getBetInfo(uint256 index) public view returns(uint256 answerBlockNumber, address bettor, bytes1 challenges) {
        BetInfo memory b = _bets[index];
        answerBlockNumber = b.answerBlockNumber;
        bettor = b.bettor;
        challenges = b.challenges;
    }

    // QUEUE push
    function pushBet(bytes1 challenges) internal returns (bool) {
        BetInfo memory b;

        b.bettor = msg.sender; // 20 byte

        b.answerBlockNumber = block.number + BET_BLOCK_INTERVAL; // 32byte -> 20000 gas
        b.challenges = challenges; // byte -> 위에 msg.sender의 20byte + 하면 20000gas

        _bets[_tail] = b;
        _tail++; // 32byte // 20000 gas

        return true;
    }


    // QUEUE pop
    // delete?? ????? ?? ???? ??? ???? ???-> delete?? ???? ??? ????
    function popBet(uint256 index) internal returns (bool) {
        delete _bets[index];
        return true;
    }

}