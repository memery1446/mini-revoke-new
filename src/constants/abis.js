const { abi: testERC1155ABI } = require('../artifacts/contracts/TestERC1155.sol/TestERC1155.json');
const { abi: testTokenABI } = require('../artifacts/contracts/TestToken.sol/TestToken.json');
const { abi: testNFTABI } = require('../artifacts/contracts/TestNFT.sol/TestNFT.json');

module.exports = {
    TOKEN_ABI: testTokenABI,
    NFT_ABI: testNFTABI,
    ERC1155_ABI: testERC1155ABI, // Ensure this is exported
    CONTRACT_ADDRESSES: {
        TK1: "0xd0385a738f2d9cbdd8ce54d712d5ed236f5d546e",  // Updates
        TK2: "0x1b2a313a51a1ac877c2aa95f73850329c8dcbfc4",  // Updates
        TestNFT: "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b",  // Updates
        ERC1155: "0x6e4f6340e92139f58cf99e32fdfe33b1ca022e92",  // Ensure this is the correct contract address
        MockSpender: "0x4330f46c529ada1ef8baa8125800be556441f3a5"
    },

    NETWORK_CONFIG: {
        1337: {
            name: "Hardhat Local Fork",
            rpcUrl: "http://127.0.0.1:8545",
            contracts: {
                tokenManager: "0xd0385a738f2d9cbdd8ce54d712d5ed236f5d546e",  // ✅ TK1
                secondToken: "0x1b2a313a51a1ac877c2aa95f73850329c8dcbfc4",  // ✅ TK2
                erc721: "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b",  // ✅ Updated NFT
                erc1155: "0x6e4f6340e92139f58cf99e32fdfe33b1ca022e92",   // ✅ Updated ERC1155
                MockSpender: "0x4330f46c529ada1ef8baa8125800be556441f3a5"
            }
        },
        1: {
            name: "Ethereum Mainnet",
            rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY",
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
            rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY",
            contracts: {
                tokenManager: "0xYourPolygonTokenManager",
                erc721: "0xYourPolygonERC721",
                erc1155: "0xYourPolygonERC1155"
            }
        }
    }
};
