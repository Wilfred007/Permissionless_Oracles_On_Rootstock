const Web3 = require('web3');
const fetch = require('node-fetch');
const winston = require('winston');
require('dotenv').config();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'oracle-node.log' }),
    new winston.transports.Console()
  ]
});

class OracleNode {
  constructor() {
    this.web3 = new Web3(process.env.RSK_RPC_URL || 'https://public-node.testnet.rsk.co');
    this.contract = new this.web3.eth.Contract(
      JSON.parse(process.env.CONTRACT_ABI), 
      process.env.CONTRACT_ADDRESS
    );
    
    const account = this.web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    this.web3.eth.accounts.wallet.add(account);
    this.address = account.address;
    
    this.apis = [
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        parser: (data) => Math.floor(data.bitcoin.usd * 100)
      },
      {
        name: 'CoinDesk',
        url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
        parser: (data) => Math.floor(parseFloat(data.bpi.USD.rate.replace(',', '')) * 100)
      },
      {
        name: 'Binance',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        parser: (data) => Math.floor(parseFloat(data.price) * 100)
      }
    ];
    
    this.retryConfig = {
      maxRetries: 3,
      backoffMs: 1000,
      maxBackoffMs: 10000
    };
    
    this.lastSubmissionTime = 0;
    this.minSubmissionInterval = 5 * 60 * 1000; // 5 minutes rate limit
  }

  async fetchPriceWithRetry(api, retries = 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'RSK-Oracle-Node/1.0' }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const price = api.parser(data);
      
      if (!price || price <= 0) {
        throw new Error('Invalid price data');
      }
      
      logger.info(`Fetched price from ${api.name}: ${price}`);
      return price;
      
    } catch (error) {
      logger.warn(`Failed to fetch from ${api.name} (attempt ${retries + 1}): ${error.message}`);
      
      if (retries < this.retryConfig.maxRetries) {
        const backoff = Math.min(
          this.retryConfig.backoffMs * Math.pow(2, retries),
          this.retryConfig.maxBackoffMs
        );
        
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.fetchPriceWithRetry(api, retries + 1);
      }
      
      throw error;
    }
  }

  async aggregatePrices() {
    const promises = this.apis.map(api => 
      this.fetchPriceWithRetry(api).catch(error => {
        logger.error(`Failed to fetch from ${api.name}: ${error.message}`);
        return null;
      })
    );
    
    const results = await Promise.all(promises);
    const validPrices = results.filter(price => price !== null);
    
    if (validPrices.length === 0) {
      throw new Error('No valid price data from any API');
    }
    
    // Calculate median of valid prices
    validPrices.sort((a, b) => a - b);
    const median = validPrices[Math.floor(validPrices.length / 2)];
    
    logger.info(`Aggregated price from ${validPrices.length} sources: ${median}`);
    return median;
  }

  async checkStakeStatus() {
    try {
      const stake = await this.contract.methods.stakes(this.address).call();
      const minStake = await this.contract.methods.config().call()
        .then(configAddr => {
          const configContract = new this.web3.eth.Contract(
            JSON.parse(process.env.CONFIG_ABI), 
            configAddr
          );
          return configContract.methods.minimumStake().call();
        });
      
      if (parseInt(stake) < parseInt(minStake)) {
        logger.error(`Insufficient stake: ${stake}, required: ${minStake}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to check stake status: ${error.message}`);
      return false;
    }
  }

  async submitPrice() {
    try {
      // Rate limiting
      const now = Date.now();
      if (now - this.lastSubmissionTime < this.minSubmissionInterval) {
        logger.info('Rate limit: skipping submission');
        return;
      }
      
      // Check stake status
      if (!(await this.checkStakeStatus())) {
        return;
      }
      
      // Get aggregated price
      const price = await this.aggregatePrices();
      
      // Check if round is still open
      const currentRound = await this.contract.methods.currentRound().call();
      const roundFinalized = await this.contract.methods.roundFinalized(currentRound).call();
      
      if (roundFinalized) {
        logger.info(`Round ${currentRound} already finalized`);
        return;
      }
      
      // Check if already submitted for this round
      const submissions = await this.contract.methods.getRoundSubmissions(currentRound).call();
      const alreadySubmitted = submissions.some(sub => 
        sub.node.toLowerCase() === this.address.toLowerCase()
      );
      
      if (alreadySubmitted) {
        logger.info(`Already submitted for round ${currentRound}`);
        return;
      }
      
      // Submit price
      const tx = this.contract.methods.submitPrice(price);
      const gas = await tx.estimateGas({ from: this.address });
      const gasPrice = await this.web3.eth.getGasPrice();
      
      const receipt = await tx.send({ 
        from: this.address, 
        gas: Math.floor(gas * 1.2), // 20% buffer
        gasPrice: gasPrice
      });
      
      this.lastSubmissionTime = now;
      
      logger.info(`Successfully submitted price ${price} in tx: ${receipt.transactionHash}`);
      
    } catch (error) {
      if (error.message.includes('Already submitted')) {
        logger.info('Already submitted for current round');
      } else if (error.message.includes('Round already finalized')) {
        logger.info('Round already finalized');
      } else {
        logger.error(`Failed to submit price: ${error.message}`);
      }
    }
  }

  async start() {
    logger.info(`Starting Oracle Node for address: ${this.address}`);
    
    // Get update interval from config
    const configAddr = await this.contract.methods.config().call();
    const configContract = new this.web3.eth.Contract(
      JSON.parse(process.env.CONFIG_ABI), 
      configAddr
    );
    const updateInterval = await configContract.methods.updateInterval().call();
    
    logger.info(`Update interval: ${updateInterval} seconds`);
    
    // Initial submission
    await this.submitPrice();
    
    // Schedule regular submissions
    setInterval(() => {
      this.submitPrice().catch(error => {
        logger.error(`Scheduled submission failed: ${error.message}`);
      });
    }, parseInt(updateInterval) * 1000);
  }
}

// Start the node
if (require.main === module) {
  const node = new OracleNode();
  node.start().catch(error => {
    logger.error(`Failed to start node: ${error.message}`);
    process.exit(1);
  });
}

module.exports = OracleNode;