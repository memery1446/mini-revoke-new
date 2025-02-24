export const NETWORK_CONFIG = {
  31337: {
    name: "Hardhat Local Fork",
    rpcUrl: "http://127.0.0.1:8545",
    contracts: {
      tokenManager: "0xd0385a738f2d9cbdd8ce54d712d5ed236f5d546e",  // ✅ TK1
      secondToken: "0x1b2a313a51a1ac877c2aa95f73850329c8dcbfc4",  // ✅ TK2
      erc721: "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b",  // ✅ Updated NFT
      erc1155: "0x6e4f6340e92139f58cf99e32fdfe33b1ca022e92",   // ✅ Updated ERC1155
      MockSpender: "0x4330F46C529ADa1Ef8BAA8125800be556441F3A5"
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

