const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Enhanced PriceOracle", function () {
  let oracle, config, owner, addr1, addr2, addr3, addr4, addr5;

  beforeEach(async () => {
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    
    // Deploy config contract first
    const OracleConfig = await ethers.getContractFactory("OracleConfig");
    config = await OracleConfig.deploy();
    await config.waitForDeployment(); // NEW SYNTAX
    
    // Deploy oracle with config address
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy(await config.getAddress()); // NEW SYNTAX
    await oracle.waitForDeployment(); // NEW SYNTAX
  });

  describe("Staking and Basic Operations", function() {
    it("Should allow staking and track nodes", async function () {
      const stakeAmount = ethers.parseEther("0.01"); // NEW SYNTAX
      
      await oracle.connect(addr1).stake({ value: stakeAmount });
      
      expect(await oracle.stakes(addr1.address)).to.equal(stakeAmount);
      expect(await oracle.getNodeCount()).to.equal(1n); // BigInt
      expect(await oracle.getNodeReputation(addr1.address)).to.equal(100n);
    });

    it("Should prevent submission without stake", async function () {
      await expect(oracle.connect(addr1).submitPrice(50000))
        .to.be.revertedWith("Insufficient stake");
    });
  });

  describe("Price Submissions", function() {
    beforeEach(async () => {
      // Stake 5 nodes
      const stakeAmount = ethers.parseEther("0.01");
      for (let i = 0; i < 5; i++) {
        await oracle.connect([addr1, addr2, addr3, addr4, addr5][i])
          .stake({ value: stakeAmount });
      }
    });

    it("Should reach consensus", async function () {
      const prices = [50000n, 50100n, 50200n, 50300n, 50400n];
      const nodes = [addr1, addr2, addr3, addr4, addr5];
      
      for (let i = 0; i < 5; i++) {
        await oracle.connect(nodes[i]).submitPrice(prices[i]);
      }
      
      const [price] = await oracle.getPrice();
      expect(price).to.equal(50200n); // median
    });
  });
});