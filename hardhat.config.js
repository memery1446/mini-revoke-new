require("@nomicfoundation/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");


const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const CMC_API_KEY = process.env.CMC_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      explorerUrl: "https://sepolia.etherscan.io/"
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 1,
      explorerUrl: "https://etherscan.io/"
    },
    // polygon: {
    //   url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    //   accounts: [PRIVATE_KEY],
    //   chainId: 137,
    //   explorerUrl: "https://polygonscan.com/"
    // },
    // bsc: {
    //   url: "https://bsc-dataseed.binance.org/",
    //   accounts: [PRIVATE_KEY],
    //   chainId: 56,
    //   explorerUrl: "https://bscscan.com/"
    // },
    // arbitrum: {
    //   url: "https://arb1.arbitrum.io/rpc",
    //   accounts: [PRIVATE_KEY],
    //   chainId: 42161,
    //   explorerUrl: "https://arbiscan.io/"
    // },
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        blockNumber: 18000000, // Optional: Pin to a stable block
          enabled: true
      },
      chainId: 1337,
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545",  
      chainId: 1337
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 50,
    coinmarketcap: CMC_API_KEY
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};

