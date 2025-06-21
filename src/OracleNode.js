const fetch = require('node-fetch');
const { ethers } = require('ethers');
require('dotenv').config();

class OracleNode {
  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      process.env.RSK_TESTNET_RPC || 'https://public-node.testnet.rsk.co'
    );
    
    // Initialize wallet
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.signer = wallet;
    
    console.log('🤖 Starting Oracle Node for address:', this.signer.address);
    
    // Contract setup
    this.oracleAddress = process.env.ORACLE_CONTRACT_ADDRESS;
    
    // Simple contract ABI for submitPrice function
    this.oracleABI = [
      "function submitPrice(uint256 _price) external",
      "function stakes(address) external view returns (uint256)",
      "function currentRound() external view returns (uint256)",
      "function getPrice() external view returns (uint256, uint256)"
    ];
    
    this.contract = new ethers.Contract(this.oracleAddress, this.oracleABI, this.signer);
    
    // Price APIs
    this.apis = [
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        parser: (data) => Math.floor(data.bitcoin.usd * 100)
      },
      {
        name: 'CoinDesk',
        url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
        parser: (data) => Math.floor(parseFloat(data.bpi.USD.rate.replace(/,/g, '')) * 100)
      }
    ];
    
    this.lastSubmissionTime = 0;
    this.submissionInterval = 10 * 60 * 1000; // 10 minutes
  }

  async fetchPriceFromAPI(api) {
    try {
      console.log(`🔍 Fetching price from ${api.name}...`);
      
      const response = await fetch(api.url, {
        timeout: 10000,
        headers: { 'User-Agent': 'RSK-Oracle-Node/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const price = api.parser(data);
      
      console.log(`✅ ${api.name} price: $${(price/100).toLocaleString()}`);
      return price;
      
    } catch (error) {
      console.log(`❌ ${api.name} failed:`, error.message);
      return null;
    }
  }

  async aggregatePrices() {
    console.log('📊 Fetching prices from multiple sources...');
    
    const promises = this.apis.map(api => this.fetchPriceFromAPI(api));
    const results = await Promise.all(promises);
    const validPrices = results.filter(price => price !== null);
    
    if (validPrices.length === 0) {
      throw new Error('No valid price data from any API');
    }
    
    // Calculate median
    validPrices.sort((a, b) => a - b);
    const median = validPrices[Math.floor(validPrices.length / 2)];
    
    console.log(`📈 Aggregated price from ${validPrices.length} sources: $${(median/100).toLocaleString()}`);
    return median;
  }

  async checkStake() {
    try {
      const stake = await this.contract.stakes(this.signer.address);
      if (stake === 0n) {
        console.log('❌ No stake found! Please stake first.');
        return false;
      }
      console.log(`💰 Current stake: ${ethers.formatEther(stake)} RBTC`);
      return true;
    } catch (error) {
      console.log('❌ Failed to check stake:', error.message);
      return false;
    }
  }

  async submitPrice() {
    try {
      console.log('\n🔄 Starting price submission...');
      
      // Check if we have a stake
      if (!(await this.checkStake())) {
        return;
      }
      
      // Rate limiting
      const now = Date.now();
      if (now - this.lastSubmissionTime < this.submissionInterval) {
        const timeLeft = Math.ceil((this.submissionInterval - (now - this.lastSubmissionTime)) / 1000);
        console.log(`⏳ Rate limit: ${timeLeft}s until next submission`);
        return;
      }
      
      // Get aggregated price
      const price = await this.aggregatePrices();
      
      // Submit to contract
      console.log('📡 Submitting price to oracle contract...');
      
      const gasEstimate = await this.contract.submitPrice.estimateGas(price);
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
      
      const tx = await this.contract.submitPrice(price, {
        gasLimit: gasEstimate * 120n / 100n, // 20% buffer
        gasPrice: 60000000 // 0.06 gwei
      });
      
      console.log(`📡 Transaction sent: ${tx.hash}`);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log(`✅ Price submitted successfully!`);
      console.log(`📊 Block: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed.toString()}`);
      
      this.lastSubmissionTime = now;
      
      // Check current oracle price
      const [currentPrice, timestamp] = await this.contract.getPrice();
      if (currentPrice > 0) {
        console.log(`🎯 Oracle price updated to: $${(Number(currentPrice)/100).toLocaleString()}`);
      }
      
    } catch (error) {
      if (error.message.includes('Already submitted')) {
        console.log('ℹ️  Already submitted for current round');
      } else if (error.message.includes('Round already finalized')) {
        console.log('ℹ️  Round already finalized');
      } else {
        console.log('❌ Submission failed:', error.message);
      }
    }
  }

  async start() {
    console.log('🚀 Oracle Node starting...');
    console.log(`📡 Network: RSK Testnet`);
    console.log(`📄 Oracle Contract: ${this.oracleAddress}`);
    
    // Initial submission
    await this.submitPrice();
    
    // Schedule regular submissions
    console.log(`⏰ Scheduling submissions every ${this.submissionInterval/1000} seconds`);
    
    setInterval(async () => {
      try {
        await this.submitPrice();
      } catch (error) {
        console.log('❌ Scheduled submission error:', error.message);
      }
    }, this.submissionInterval);
    
    console.log('✅ Oracle Node is running! Press Ctrl+C to stop.');
  }
}

// Start the node
if (require.main === module) {
  const node = new OracleNode();
  node.start().catch(error => {
    console.error('💥 Node startup failed:', error.message);
    process.exit(1);
  });
}