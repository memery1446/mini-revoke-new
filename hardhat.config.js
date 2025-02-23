require("@nomicfoundation/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();
require("@nomicfoundation/hardhat-chai-matchers");

const INFURA_URL = process.env.INFURA_URL || "https://mainnet.infura.io/v3/873f1dfbc0294062843aadbe3d6afc9e";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
        sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/873f1dfbc0294062843aadbe3d6afc9e",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    hardhat: {
      forking: {
        url: INFURA_URL,
        enabled: true,
      },
      chainId: 1337, // Keep this for consistency with MetaMask
    },
    localhost: {
      chainId: 1337,
      url: "http://127.0.0.1:8545"
    },
    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/873f1dfbc0294062843aadbe3d6afc9e",
      chainId: 137,
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  paths: {
    artifacts: "./src/artifacts", // Point Hardhat to the correct artifacts directory
  }
};