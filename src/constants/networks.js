export const NETWORK_CONFIG = {
1337: {  // Hardhat Chain ID
  name: "Hardhat",
  rpcUrl: process.env.HARDHAT_RPC_URL || 
          "http://127.0.0.1:8545",

    contracts: {
      tokenManager: "0x111111111117dC0aa78b770fA6A738034120C302",  
      secondToken: "0x111111111117dC0aa78b770fA6A738034120C302",  
      erc721: "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",  
      erc1155: "0x0DB30C6CC6440E2B534D06EDF2969FCAED1C6B2B",   
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

