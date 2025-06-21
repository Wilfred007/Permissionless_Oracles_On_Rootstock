const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  const [signer] = await ethers.getSigners();
  
  if (!process.env.ORACLE_CONTRACT_ADDRESS) {
    console.log(" Please set ORACLE_CONTRACT_ADDRESS in .env");
    return;
  }
  
  const oracle = await ethers.getContractAt("PriceOracle", process.env.ORACLE_CONTRACT_ADDRESS);
  
  console.log("🔍 Checking stake status...");
  console.log("Account:", signer.address);
  
  try {
    const stake = await oracle.stakes(signer.address);
    const reputation = await oracle.getNodeReputation(signer.address);
    const nodeCount = await oracle.getNodeCount();
    
    console.log(`Current stake: ${ethers.utils.formatEther(stake)} RBTC`);
    console.log(` Reputation: ${reputation}%`);
    console.log(` Total nodes: ${nodeCount}`);
    
    const [price, timestamp] = await oracle.getPrice();
    if (price > 0) {
      console.log(` Latest price: $${price/100}`);
      console.log(` Last update: ${new Date(timestamp * 1000).toLocaleString()}`);
    } else {
      console.log("No price data yet");
    }
  } catch (error) {
    console.error(" Error:", error.message);
  }
}

main().catch(console.error);