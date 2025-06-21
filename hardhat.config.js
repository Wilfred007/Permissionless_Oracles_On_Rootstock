// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

// module.exports = {
//   solidity: "0.8.14",
//   networks: {
//     hardhat: {
//       chainId: 1337
//     },
//     rskTestnet: {
//       url: process.env.RPC_URL,
//       chainId: 31,
//       accounts: [process.env.PRIVATE_KEY], 
//     },
   
//   }
// };

require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    rskTestnet: {
      url: process.env.RSK_TESTNET_RPC || "https://public-node.testnet.rsk.co",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 31,
      gasPrice: 60000000, // 0.06 gwei
      gas: 6800000,
      timeout: 120000,
      confirmations: 1
    },
    rskMainnet: {
      url: process.env.RSK_MAINNET_RPC || "https://public-node.rsk.co",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 30,
      gasPrice: 60000000,
      gas: 6800000,
      timeout: 120000,
      confirmations: 3
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};