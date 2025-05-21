const { Web3 } = require("web3"); // Correct import for web3@4.x
const fetch = require("node-fetch");

// Configuration
const config = {
  rpcUrl: "https://public-node.rsk.co",
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", 
  privateKey: process.env.PRIVATE_KEY,
  gasLimit: 200000,
  submissionInterval: 10 * 60 * 1000
};

// PriceOracle ABI
const abi = [
  // Add your ABI here (from artifacts/contracts/PriceOracle.json)
  process.env.CONTRACT_ABI
];

// Initialize Web3
const web3 = new Web3(config.rpcUrl);
const contract = new web3.eth.Contract(abi, config.contractAddress);
const account = web3.eth.accounts.privateKeyToAccount(config.privateKey);
web3.eth.accounts.wallet.add(account);

async function fetchPriceFromAPI() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (!data.bitcoin || !data.bitcoin.usd) throw new Error("Invalid price data");
    return Math.floor(data.bitcoin.usd * 100);
  } catch (error) {
    console.error("Error fetching price:", error.message);
    throw error;
  }
}

async function submitPrice() {
  try {
    const price = await fetchPriceFromAPI();
    console.log(`Fetched price: ${price}`);

    const tx = contract.methods.submitPrice(price);
    const gas = await tx.estimateGas({ from: account.address });

    const receipt = await tx.send({
      from: account.address,
      gas: Math.min(gas * 1.2, config.gasLimit),
      gasPrice: await web3.eth.getGasPrice()
    });

    console.log(`Submitted price: ${price}, Tx Hash: ${receipt.transactionHash}`);
    return receipt;
  } catch (error) {
    console.error("Error submitting price:", error.message);
    throw error;
  }
}

submitPrice().catch(console.error);
setInterval(() => submitPrice().catch(console.error), config.submissionInterval);