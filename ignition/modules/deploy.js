const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy();
  await oracle.waitForDeployment();

  console.log("PriceOracle deployed to:", oracle.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});