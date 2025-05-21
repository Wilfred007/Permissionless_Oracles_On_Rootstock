require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.14",
  networks: {
    hardhat: {
      chainId: 1337
    },
    rskTestnet: {
      url: process.env.RPC_URL,
      chainId: 31,
      accounts: [process.env.PRIVATE_KEY], 
    },
    // rskMainnet: {
    //   url: "https://public-node.rsk.co",
    //   chainId: 30,
    //   accounts: ["0xYourPrivateKey"] 
    // }
  }
};


//Contract address
//0x734B1987Eb1D7cDC631D890CBa456aa8c8A085Ff