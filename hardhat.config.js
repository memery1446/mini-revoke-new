require("@nomicfoundation/hardhat-ethers");
// require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();
require("@nomicfoundation/hardhat-chai-matchers");


const INFURA_URL = process.env.INFURA_URL || "https://mainnet.infura.io/v3/873f1dfbc0294062843aadbe3d6afc9e";

module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        url: INFURA_URL,
        blockNumber: process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : undefined,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 1337,
    },
  },
  paths: {
    artifacts: "./src/artifacts",
  },
  mocha: {
    timeout: 200000,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  gasReporter: {
    enabled: process.env.GAS_REPORT === "true",
    currency: "USD",
  },
};
