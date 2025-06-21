const fetch = require('node-fetch');

async function fetchPrice() {
  try {
    console.log("🔍 Fetching Bitcoin price from CoinGecko...");
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const price = Math.floor(data.bitcoin.usd * 100); // Convert to cents
    return price;
  } catch (error) {
    throw new Error(`Failed to fetch price: ${error.message}`);
  }
}

async function simulateNode() {
  console.log("🤖 Starting Oracle Node Simulation...\n");
  console.log("This simulates what your oracle node would do:\n");
  
  for (let i = 0; i < 3; i++) {
    console.log(`🔄 Simulation round ${i + 1}:`);
    try {
      const price = await fetchPrice();
      console.log(`✅ Would submit price: $${(price/100).toLocaleString()}`);
      console.log(`📊 Raw price value: ${price} (in cents)\n`);
      
      // Wait 3 seconds before next round
      if (i < 2) {
        console.log("⏳ Waiting 3 seconds...\n");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.log(`❌ Round ${i + 1} failed: ${error.message}\n`);
    }
  }
  
  console.log("✅ Simulation completed!");
  console.log("\n🔥 Next step: Deploy your contracts and start the real oracle node!");
}

// Only run if this file is executed directly
if (require.main === module) {
  simulateNode().catch(error => {
    console.error("💥 Simulation failed:", error.message);
    process.exit(1);
  });
}

module.exports = { fetchPrice, simulateNode };