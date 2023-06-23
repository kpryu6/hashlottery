pragma solidity >=0.4.22 <0.9.0;

contract Lottery{

    // answer Block
    
    struct BetInfo {
        uint256 answerBlockNumber;
        // payable? ?? transfer ??
        address payable bettor;
        bytes1 challenges; //0xab
    }

    // QUEUE
    uint256 private _tail;
    uint256 private _head;
    mapping (uint256 => BetInfo) private _bets;

    // ??
    address public owner;
    
    // BLOCK HASH ??? ? ?? ?? 256
    uint256 constant internal BLOCK_LIMIT = 256;

    // 3? ???? ?????? 6? ??? ??????.
    uint256 constant internal BET_BLOCK_INTERVAL = 3;

    // ???? ?? 0.005ETH // 1ETH = 10 ** 18
    uint256 constant internal BET_AMOUNT = 5 * 10 ** 15;

    // pot money ??
    uint256 private _pot;

    // EVENT
    event BET(uint256 index, address bettor, uint256 amount, bytes1 challenges, uint answerBlockNumber);

    // ???? ???? ??
    constructor() public {
        owner = msg.sender;
    }



    // getter : smart contract? ?? ??? ???? view
    function getPot() public view returns (uint256 pot){
        return _pot;
    }

    //Bet

    /*
    * @dev ??? ??. ??? 0.005ETH? ??? ??, ??? 1 byte ??? ???.
    * ?? ??? ?? ??? ?? distribute ???? ????.
    * @param challenges ??? ???? ??
    * @return ??? ? ?????? ???? bool ?
    */
    // challenges : owner? ???? ??
    // payable ???? ? ??? ????
    function bet(bytes1 challenges) public payable returns (bool result) {

        // Check the proper ether is sent (?? ??? ????? ??)
        // ??? ???? ??? Not enough ETH
        require(msg.value == BET_AMOUNT, "Not enough ETH");

        // Push bet to the queue
        require(pushBet(challenges), "Fail to add a new Bet Info");

        // Emit event
        emit BET(_tail -1, msg.sender, msg.value, challenges, block.number + BET_BLOCK_INTERVAL);
        return true;

    }
        //bet ? QUEUE ??

    //Distribute(??)

        // ??? ??
        // 


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
        // msg.sender? ?? ??? address?? payable ??? bettor ?? ???
        b.bettor = msg.sender;

        b.answerBlockNumber = block.number + BET_BLOCK_INTERVAL;
        b.challenges = challenges;

        _bets[_tail] = b;
        _tail++;

        return true;
    }


    // QUEUE pop
    // delete?? ????? ?? ???? ??? ???? ???-> delete?? ???? ??? ????
    function popBet(uint256 index) internal returns (bool) {
        delete _bets[index];
        return true;
    }

}