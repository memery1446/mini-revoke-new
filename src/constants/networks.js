export const NETWORK_CONFIG = {
1337: {  // Hardhat Chain ID
  name: "Hardhat",
  rpcUrl: process.env.HARDHAT_RPC_URL || 
          "http://127.0.0.1:8545",
  contracts: {
      tokenManager: "0xa85EffB2658CFd81e0B1AaD4f2364CdBCd89F3a1", // TK1
      secondToken: "0x8aAC5570d54306Bb395bf2385ad327b7b706016b", // TK2
      erc721: [
          "0x6484EB0792c646A4827638Fc1B6F20461418eB00", // TestNFT
          "0xf201fFeA8447AB3d43c98Da3349e0749813C9009", // UpgradeableNFT
          "0xA75E74a5109Ed8221070142D15cEBfFe9642F489"  // DynamicNFT
      ],
      erc1155: [
          "0x26291175Fa0Ea3C8583fEdEB56805eA68289b105", // TestERC1155
          "0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038"  // UpgradeableERC1155
      ],
      MockSpender: "0x1bEfE2d8417e22Da2E0432560ef9B2aB68Ab75Ad"
  }
  },
  1: {
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY",
    contracts: {
      tokenManager: "0xYourEthereumTokenManager",
      erc721: "0xYourEthereumERC721",
      erc1155: "0xYourEthereumERC1155"
    }
  },
  56: {
    name: "Binance Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    contracts: {
      tokenManager: "0xYourBSCManager",
      erc721: "0xYourBSCERC721",
      erc1155: "0xYourBSCERC1155"
    }
  },
  137: {
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com/",
    contracts: {
      tokenManager: "0xYourPolygonTokenManager",
      erc721: "0xYourPolygonERC721",
      erc1155: "0xYourPolygonERC1155"
    }
  }
};

