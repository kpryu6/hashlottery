// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Lottery{

    // answer Block
    
    struct BetInfo {
        uint256 answerBlockNumber;
        // payable ������� transfer ����
        address payable bettor;
        bytes1 challenges; //0xab
    }

    // QUEUE
    uint256 private _tail;
    uint256 private _head;
    mapping (uint256 => BetInfo) private _bets;

    // ??
    address public owner;
    
    // BLOCK HASH�� Ȯ���� �� �ִ� ���� 256
    uint256 constant internal BLOCK_LIMIT = 256;

    // 3�� ����� ������ �ϰ� �Ǹ� 6�� ���� ������ �ϰ� �ȴ�
    uint256 constant internal BET_BLOCK_INTERVAL = 3;

    // �����ϴ� �ݾ� 0.005ETH // 1ETH = 10 ** 18
    uint256 constant internal BET_AMOUNT = 5 * 10 ** 15;

    // pot money ??
    uint256 private _pot;


    // BlockStatus Enum
    enum BlockStatus { Checkable, NotRevealed, BlockLimitPassed}

    // ��Ī ��� Enum
    enum BettingResult { Win, Fail, Draw}

    // EVENT
    event BET(uint256 index, address bettor, uint256 amount, bytes1 challenges, uint answerBlockNumber); // emit ��ü 375gas + �Ķ���� �ϳ� �� 375 gas + �Ķ���� ���� �ɶ� byte�� 8gas => 4~5000 gas 

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
    * @dev ������ �Ѵ�. ������ 0.005ETH�� �������ϰ�, ���ÿ� 1 byte ���ڸ� ������.
    * ť�� ����� ���� ������ ���� distribute �Լ����� �ذ�ȴ�.
    * @param challenges ������ �����ϴ� ����
    * @return �Լ��� �� ����Ǿ����� Ȯ���ϴ� bool ��
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
    

    //Distribute ����
    function distribute() public {
        // head 3 4 5 ... 11 12 tail
        uint256 cur;
        BetInfo memory b;
        BlockStatus currentBlockStatus;

        for (cur = _head; cur < _tail; cur++) {

            // BetInfo �ҷ�����
            b = _bets[cur];
            currentBlockStatus = getBlockStatus(b.answerBlockNumber);

            // Checkable : (block.number > answerBlockNumber) && (block.number < BLOCK_LIMIT + answerBlockNumber) (���� ��Ϻ��� 256 �������� Ȯ���� �� �ִ� �̰Թ���������?)
            if (currentBlockStatus == BlockStatus.Checkable) {
                // if win , bettor�� pot money ������

                // if fail, bettor�� ���� pot���� ��

                // if draw (�ѱ��ڸ� ���� ���), refund bettor's money
            }
            
            // block�� mining ���� ���� ����(not revealed) : block.number <= answerBlockNumber // ��ȣ�� ���� ���� : ��������� �����̹Ƿ� block.number Ȯ�� �Ұ�
            if (currentBlockStatus == BlockStatus.NotRevealed) {
                break;
            }

            // block limit passed (��������) : block.number >= BLOCK_LIMIT + answerBlockNumber
            if (currentBlockStatus == BlockStatus.BlockLimitPassed) {
                // refund
                // emit refund
            }

            popBet(cur);


        

        }
    }

    /*
    * @dev ���ñ��ڿ� ������ Ȯ���Ѵ�.
    * @param challenges ���� ����
    * @param answer ��� �ؽ�
    * @return ������
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
        // Block ����
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
        b.challenges = challenges; // byte -> ���� msg.sender�� 20byte + �ϸ� 20000gas

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