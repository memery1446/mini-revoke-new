export const NETWORK_CONFIG = {
  31337: {
    name: "Hardhat Local Fork",
    rpcUrl: "http://127.0.0.1:8545",
    contracts: {
      tokenManager: "0xae246e208ea35b3f23de72b697d47044fc594d5f",  // ✅ TK1
      secondToken: "0x82bbaa3b0982d88741b275ae1752db85cafe3c65",  // ✅ TK2
      erc721: "0x084815d1330ecc3ef94193a19ec222c0c73dff2d",  // ✅ Updated NFT
      erc1155: "0x76a999d5f7efde0a300e710e6f52fb0a4b61ad58",   // ✅ Updated ERC1155
      MockSpender: "0x43c5df0c482c88cef8005389f64c362ee720a5bc"
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

