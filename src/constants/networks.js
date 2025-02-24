export const NETWORK_CONFIG = {
  31337: {
    name: "Hardhat Local Fork",
    rpcUrl: "http://127.0.0.1:8545",
    contracts: {
      tokenManager: "0x483FA7f61170c19276B3DbB399e735355Ae7676a",  // ✅ TK1
      secondToken: "0xE7B9Ede68593354aff96690600D008A40519D3CF",  // ✅ TK2
      erc721: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354",  // ✅ Updated NFT
      erc1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A",   // ✅ Updated ERC1155
      MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
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

