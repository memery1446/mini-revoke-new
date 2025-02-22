require("@nomicfoundation/hardhat-ethers");
// require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();
require("@nomicfoundation/hardhat-chai-matchers");


const INFURA_URL = process.env.INFURA_URL || "https://mainnet.infura.io/v3/873f1dfbc0294062843aadbe3d6afc9e";

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/873f1dfbc0294062843aadbe3d6afc9e",
        enabled: true,
      },
      chainId: 1337, // ✅ Keep this for consistency with MetaMask
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
    },
  },
};

