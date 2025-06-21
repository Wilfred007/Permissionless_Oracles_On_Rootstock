// const hre = require("hardhat");

// async function main() {
//   const [deployer] = await hre.ethers.getSigners();
//   console.log("Deploying with account:", deployer.address);

//   const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
//   const oracle = await PriceOracle.deploy();
//   await oracle.waitForDeployment();

//   console.log("PriceOracle deployed to:", oracle.target);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });


const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying with account:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Step 1: Deploy OracleConfig FIRST (no constructor arguments)
  console.log("\n📋 Deploying OracleConfig...");
  const OracleConfig = await ethers.getContractFactory("OracleConfig");
  const config = await OracleConfig.deploy(); // No arguments
  await config.waitForDeployment();
  
  const configAddress = await config.getAddress();
  console.log("✅ OracleConfig deployed to:", configAddress);

  // Step 2: Deploy PriceOracle with config address
  console.log("\n📊 Deploying PriceOracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy(configAddress); // Pass config address!
  await oracle.waitForDeployment();
  
  const oracleAddress = await oracle.getAddress();
  console.log("✅ PriceOracle deployed to:", oracleAddress);

  // Step 3: Verify it works
  console.log("\n🔍 Verifying deployment...");
  const minStake = await config.minimumStake();
  const nodeCount = await oracle.getNodeCount();
  
  console.log("✅ Config min stake:", ethers.formatEther(minStake), "RBTC");
  console.log("✅ Oracle node count:", nodeCount.toString());
  
  console.log("\n🎉 Deployment successful!");
  console.log("📝 Update your .env with:");
  console.log(`ORACLE_CONTRACT_ADDRESS=${oracleAddress}`);
  console.log(`CONFIG_CONTRACT_ADDRESS=${configAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});