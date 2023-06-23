// build 폴더 안에 Migrations 가져오기
const Lottery = artifacts.require("Lottery");

module.exports = function (deployer) {
  // deployer가 배포
  // deployer에 truffle-config.js에 있는 내 주소가 매핑됨
  deployer.deploy(Lottery);
};
