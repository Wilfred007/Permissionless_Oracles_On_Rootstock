const { expect } = require("chai");
const nock = require("nock");
const { Web3 } = require("web3"); 
const hre = require("hardhat");

describe("Price Submission", function () {
  let oracle, account, contract;

  beforeEach(async function () {
    // Deploy contract
    const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();

    // Setup Web3
    const web3 = new Web3(hre.network.config.url); 
    [account] = await hre.ethers.getSigners();
    contract = new web3.eth.Contract(JSON.parse(oracle.interface.format("json")), oracle.target);
    web3.eth.accounts.wallet.add(account);

    // Stake
    await oracle.stake({ value: hre.ethers.parseEther("0.01") });

    // Mock CoinGecko API
    nock("https://api.coingecko.com")
      .get("/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
      .reply(200, { bitcoin: { usd: 50000 } });
  });

  it("Should submit price successfully", async function () {
    const price = 50000 * 100; // 50000 USD in cents
    const tx = contract.methods.submitPrice(price);
    const receipt = await tx.send({ from: account.address, gas: 200000 });

    expect(receipt.status).to.equal(true);
    const latestPrice = await oracle.getPrice();
    expect(latestPrice).to.equal(price);
  });
});