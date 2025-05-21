const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceOracle", function () {
  let oracle;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy();
    await oracle.waitForDeployment();
  });

  it("Should allow staking and reject early withdraw", async function () {
    await oracle.connect(addr1).stake({ value: ethers.parseEther("0.01") });

    // Try to withdraw without initiating
    await expect(
      oracle.connect(addr1).withdraw()
    ).to.be.revertedWith("Withdraw not initiated");

    // Initiate withdrawal and try immediately
    await oracle.connect(addr1).initiateWithdraw();
    await expect(
      oracle.connect(addr1).withdraw()
    ).to.be.revertedWith("Cooldown not passed");
  });

  it("Should allow withdraw after cooldown", async function () {
    await oracle.connect(addr1).stake({ value: ethers.parseEther("0.01") });

    // Initiate withdrawal
    await oracle.connect(addr1).initiateWithdraw();

    // Increase time by more than 1 day (86400 seconds)
    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine");

    // Withdraw should succeed
    await expect(
      oracle.connect(addr1).withdraw()
    ).to.emit(oracle, "StakeWithdrawn")
      .withArgs(addr1.address, ethers.parseEther("0.01"));

    const stake = await oracle.stakes(addr1.address);
    expect(stake).to.equal(0);
  });
});