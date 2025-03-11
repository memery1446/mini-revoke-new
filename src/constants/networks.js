export const NETWORK_CONFIG = {
11155111: {  // Sepolia Chain ID
  name: "Sepolia",
  rpcUrl: process.env.SEPOLIA_RPC_URL || 
          "https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY",

    contracts: {
      tokenManager: "0x2B042eF97864f2B78309BEE80Af70Aea6FFcDc79",  
      secondToken: "0x50AE7C0a775b2fC8Cb4089CE9F9aa3ffEc341f7b",  
      erc721: "0xDd81A953804F8DE4942cC2DF51FC7dc7273112E2",  
      erc1155: "0xDDC69cbaD475C1477d6D7fdF7CA8580f75EC53EF",   
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

