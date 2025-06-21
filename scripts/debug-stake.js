const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  const [signer] = await ethers.getSigners();
  
  console.log("🔍 DEBUGGING STAKE TRANSACTION");
  console.log("=====================================");
  
  console.log("👤 Account:", signer.address);
  console.log("📄 Oracle Address:", process.env.ORACLE_CONTRACT_ADDRESS);
  
  try {
    // 1. Check balance
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "RBTC");
    
    // 2. Test contract connection
    const oracle = await ethers.getContractAt("PriceOracle", process.env.ORACLE_CONTRACT_ADDRESS);
    console.log("✅ Oracle contract connected");
    
    // 3. Get config address
    const configAddress = await oracle.config();
    console.log("📄 Config Address:", configAddress);
    
    // 4. Test config contract
    const config = await ethers.getContractAt("OracleConfig", configAddress);
    console.log("✅ Config contract connected");
    
    // 5. Check minimum stake requirement
    const minStake = await config.minimumStake();
    console.log("💰 Minimum Stake:", ethers.formatEther(minStake), "RBTC");
    
    // 6. Check if already staked
    const currentStake = await oracle.stakes(signer.address);
    console.log("📊 Current Stake:", ethers.formatEther(currentStake), "RBTC");
    
    if (currentStake > 0) {
      console.log("✅ Already staked! No need to stake again.");
      return;
    }
    
    // 7. Check other contract state
    const nodeCount = await oracle.getNodeCount();
    const currentRound = await oracle.currentRound();
    console.log("🌐 Node Count:", nodeCount.toString());
    console.log("🔄 Current Round:", currentRound.toString());
    
    // 8. Calculate stake amount
    const gasReserve = ethers.parseEther("0.0001");
    const availableForStake = balance - gasReserve;
    const stakeAmount = availableForStake < minStake ? availableForStake : minStake;
    
    console.log("💰 Will attempt to stake:", ethers.formatEther(stakeAmount), "RBTC");
    
    // 9. Check if stake amount meets minimum
    if (stakeAmount < minStake) {
      console.log("❌ Stake amount below minimum!");
      console.log("   Available:", ethers.formatEther(stakeAmount), "RBTC");
      console.log("   Required:", ethers.formatEther(minStake), "RBTC");
      console.log("💡 Need to lower minimum stake further or get more funds");
      return;
    }
    
    // 10. Try to call the contract function with staticCall first (read-only test)
    console.log("🧪 Testing stake call (read-only)...");
    try {
      await oracle.stake.staticCall({ value: stakeAmount });
      console.log("✅ Static call succeeded - transaction should work");
    } catch (staticError) {
      console.log("❌ Static call failed:", staticError.message);
      
      // Check specific revert reasons
      if (staticError.message.includes("Below minimum stake")) {
        console.log("💡 Reason: Stake amount below minimum");
      } else if (staticError.message.includes("Insufficient funds")) {
        console.log("💡 Reason: Not enough gas or balance");
      } else {
        console.log("💡 Unknown contract revert reason:", staticError.message);
      }
      return;
    }
    
    // 11. If static call passes, try actual transaction
    console.log("📡 Attempting actual transaction...");
    
    const gasEstimate = await oracle.stake.estimateGas({ value: stakeAmount });
    console.log("⛽ Gas estimate:", gasEstimate.toString());
    
    const tx = await oracle.stake({ 
      value: stakeAmount,
      gasLimit: gasEstimate * 150n / 100n,
      gasPrice: 60000000
    });
    
    console.log("📡 Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ SUCCESS! Block:", receipt.blockNumber);
    
    // Verify final state
    const finalStake = await oracle.stakes(signer.address);
    console.log("📊 Final stake:", ethers.formatEther(finalStake), "RBTC");
    
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    
    // Specific error analysis
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Issue: Not enough balance for gas + stake");
    } else if (error.message.includes("call revert exception")) {
      console.log("💡 Issue: Contract call failed - check contract deployment");
    } else if (error.message.includes("transaction reverted")) {
      console.log("💡 Issue: Transaction reverted at contract level");
      console.log("   Possible causes:");
      console.log("   - Stake amount below minimum");
      console.log("   - Contract logic error");
      console.log("   - Already staked");
    }
  }
}

main().catch(console.error);