import logo from "./logo.svg";
import "./App.css";
import { useEffect } from "react";
import Web3 from "web3";

// truffle migrate --reset�ؼ� ���� contractAddress (��������)
let lotteryAddress = "0x6A637B1081322573749e89c1d5Af4e953162338f";

// Lottery.json�� �ִ� abi, abi�� smart contract�� ��ȣ�ۿ��� �� �ʿ��ϴ�.
let lotteryABI = [
  {
    constant: true,
    inputs: [],
    name: "answerForTest",
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
    signature: "0x84f7e4f0",
  },
  {
    constant: true,
    inputs: [],
    name: "owner",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
    signature: "0x8da5cb5b",
  },
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
    signature: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        name: "bettor",
        type: "address",
      },
      {
        indexed: false,
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        name: "challenges",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answerBlockNumber",
        type: "uint256",
      },
    ],
    name: "BET",
    type: "event",
    signature:
      "0x100791de9f40bf2d56ffa6dc5597d2fd0b2703ea70bc7548cd74c04f5d215ab7",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        name: "bettor",
        type: "address",
      },
      {
        indexed: false,
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        name: "challenges",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answer",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answerBlockNumber",
        type: "uint256",
      },
    ],
    name: "WIN",
    type: "event",
    signature:
      "0x8219079e2d6c1192fb0ff7f78e6faaf5528ad6687e69749205d87bd4b156912b",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        name: "bettor",
        type: "address",
      },
      {
        indexed: false,
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        name: "challenges",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answer",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answerBlockNumber",
        type: "uint256",
      },
    ],
    name: "FAIL",
    type: "event",
    signature:
      "0x3b19d607433249d2ebc766ae82ca3848e9c064f1febb5147bc6e5b21d0adebc5",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        name: "bettor",
        type: "address",
      },
      {
        indexed: false,
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        name: "challenges",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answer",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answerBlockNumber",
        type: "uint256",
      },
    ],
    name: "DRAW",
    type: "event",
    signature:
      "0x72ec2e949e4fad9380f9d5db3e2ed0e71cf22c51d8d66424508bdc761a3f4b0e",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "index",
        type: "uint256",
      },
      {
        indexed: false,
        name: "bettor",
        type: "address",
      },
      {
        indexed: false,
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        name: "challenges",
        type: "bytes1",
      },
      {
        indexed: false,
        name: "answerBlockNumber",
        type: "uint256",
      },
    ],
    name: "REFUND",
    type: "event",
    signature:
      "0x59c0185881271a0f53d43e6ab9310091408f9e0ff9ae2512613de800f26b8de4",
  },
  {
    constant: true,
    inputs: [],
    name: "getPot",
    outputs: [
      {
        name: "pot",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
    signature: "0x403c9fa8",
  },
  {
    constant: false,
    inputs: [
      {
        name: "challenges",
        type: "bytes1",
      },
    ],
    name: "betAndDistribute",
    outputs: [
      {
        name: "result",
        type: "bool",
      },
    ],
    payable: true,
    stateMutability: "payable",
    type: "function",
    signature: "0xe16ea857",
  },
  {
    constant: false,
    inputs: [
      {
        name: "challenges",
        type: "bytes1",
      },
    ],
    name: "bet",
    outputs: [
      {
        name: "result",
        type: "bool",
      },
    ],
    payable: true,
    stateMutability: "payable",
    type: "function",
    signature: "0xf4b46f5b",
  },
  {
    constant: false,
    inputs: [],
    name: "distribute",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
    signature: "0xe4fc6b6d",
  },
  {
    constant: false,
    inputs: [
      {
        name: "answer",
        type: "bytes32",
      },
    ],
    name: "setAnswerforTest",
    outputs: [
      {
        name: "result",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
    signature: "0x851df7c6",
  },
  {
    constant: true,
    inputs: [
      {
        name: "challenges",
        type: "bytes1",
      },
      {
        name: "answer",
        type: "bytes32",
      },
    ],
    name: "isMatch",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "pure",
    type: "function",
    signature: "0x99a167d7",
  },
  {
    constant: true,
    inputs: [
      {
        name: "index",
        type: "uint256",
      },
    ],
    name: "getBetInfo",
    outputs: [
      {
        name: "answerBlockNumber",
        type: "uint256",
      },
      {
        name: "bettor",
        type: "address",
      },
      {
        name: "challenges",
        type: "bytes1",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
    signature: "0x79141f80",
  },
];

function App() {
  useEffect(() => {
    initWeb3();
  }, []);

  /* 
  * useEffect()�� 2�� ����Ǵ� ����
  * index.js�� <React.StrictMode> �±׷� <app/>�� ������ �־ �׷���.
  * Strict ���� ���� ��忡���� Ȱ��ȭ�ǰ�, ���ø����̼� ���� �������� ������ �˾Ƴ��� ���� �����̴�.
  
  **************************************

  * �������� ���� �����ֱ⸦ ����ϴ� ������Ʈ �߰�
  * ���Ž� ���ڿ� ref ��뿡 ���� ���
  * ������� �ʴ� findDOMNode ��뿡 ���� ���
  * ����ġ ���� ���ۿ� �˻�
  * ���Ž� context API �˻�
  * Ensuring reusable state
*/

  // ���� : https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  const initWeb3 = async () => {
    let web3;
    if (window.ethereum) {
      // ethereum ��ü�� �ִ��� Ȯ��
      console.log("Recent mode");
      web3 = new Web3(window.ethereum); // web3 ��ü ��������
      try {
        // Request account access if needed
        await window.ethereum.enable(); // ���� ������ â�� �߰� ������ ������ web3 ��ü ������ �ż� ��밡���ϰ� �Ǵ°�
        // Acccounts now exposed
        // this.web3.eth.sendTransaction({/* ... */});
      } catch (error) {
        // User denied account access...
        console.log(`User denied account access error : ${error}`);
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      console.log("legacy mode");
      web3 = new Web3(Web3.currentProvider);
      // Acccounts always exposed
      // web3.eth.sendTransaction({/* ... */});
    }
    // Non-dapp browsers...
    else {
      console.log(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }

    console.log(web3);
    let accounts = await web3.eth.getAccounts();
    console.log(accounts); // ��Ÿ����ũ�� ������ accounts ��������
    const account = accounts[0];

    const lotteryContract = new web3.eth.Contract(lotteryABI, lotteryAddress);
    console.log(lotteryContract);

    // contract�� �ִ� method �߿� getPot()�� ������ �������ּ���
    // call() : smart contract���� contract�� ���¸� ��ȭ��Ű�� �ʴ�, ���ü���� ���� Ʈ��������� ��������� �ʴ�, ���� �о���� ��
    // ���¸� ��ȭ��Ű�ų� ���� Ʈ��������� ��������� ������ ����� ���� envoke(), send() ���

    let pot = lotteryContract.methods.getPot().call();
    console.log(pot);

    let owner = lotteryContract.methods.owner().call();
    console.log(owner);
  };

  /* truffle console�� �̴� �ű��
  > web3.eth.getAccounts()�� �ִ� ù��° �ּ� let ac1�� ����
  > web3.eth.sendTransaction({from:ac1, to:'�����ּ�', value:'1000000000000000000'})
  > ����
  */

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
