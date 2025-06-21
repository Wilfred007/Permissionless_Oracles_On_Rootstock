const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.connect(signer).attach(contractAddress);

  const stakeAmount = hre.ethers.parseEther("0.01");
  const tx = await oracle.stake({ value: stakeAmount });
  await tx.wait();

  console.log(`Staked 0.01 RBTC for ${signer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});