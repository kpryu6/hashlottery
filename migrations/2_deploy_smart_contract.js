// build ���� �ȿ� Migrations ��������
const Lottery = artifacts.require("Lottery");

module.exports = function (deployer) {
  // deployer�� ����
  // deployer�� truffle-config.js�� �ִ� �� �ּҰ� ���ε�
  deployer.deploy(Lottery);
};
