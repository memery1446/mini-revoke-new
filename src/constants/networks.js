export const NETWORK_CONFIG = {
  31337: {
    name: "Hardhat Local Fork",
    rpcUrl: "http://127.0.0.1:8545",
    contracts: {
      tokenManager: "0xef66010868ff77119171628b7efa0f6179779375",  // ✅ TK1
      secondToken: "0xd544d7a5ef50c510f3e90863828eaba7e392907a",  // ✅ TK2
      erc721: "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b",  // ✅ Updated NFT
      erc1155: "0x1f585372f116e1055af2bed81a808ddf9638dccd",   // ✅ Updated ERC1155
      MockSpender: "0xff8fa9381caf61cb3368a6ec0b3f5c788028d0cd"
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

