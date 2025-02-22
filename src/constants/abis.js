const { abi: testERC1155ABI } = require('../artifacts/contracts/TestERC1155.sol/TestERC1155.json');
const { abi: testTokenABI } = require('../artifacts/contracts/TestToken.sol/TestToken.json');
const { abi: testNFTABI } = require('../artifacts/contracts/TestNFT.sol/TestNFT.json');

module.exports = {
    TOKEN_ABI: testTokenABI,
    NFT_ABI: testNFTABI,
    ERC1155_ABI: testERC1155ABI, // Ensure this is exported
    CONTRACT_ADDRESSES: {
        TK1: "0xae246e208ea35b3f23de72b697d47044fc594d5f",  // Updates
        TK2: "0x82bbaa3b0982d88741b275ae1752db85cafe3c65",  // Updates
        TestNFT: "0x084815d1330ecc3ef94193a19ec222c0c73dff2d",  // Updates
        ERC1155: "0x76a999d5f7efde0a300e710e6f52fb0a4b61ad58",  // Ensure this is the correct contract address
        MockSpender: "0x9DBb24B10502aD166c198Dbeb5AB54d2d13AfcFd"
    },

    NETWORK_CONFIG: {
        1337: {
            name: "Hardhat Local Fork",
            rpcUrl: "http://127.0.0.1:8545",
            contracts: {
                tokenManager: "0xae246e208ea35b3f23de72b697d47044fc594d5f",  // ✅ TK1
                secondToken: "0x82bbaa3b0982d88741b275ae1752db85cafe3c65",  // ✅ TK2
                erc721: "0x084815d1330ecc3ef94193a19ec222c0c73dff2d",  // ✅ Updated NFT
                erc1155: "0x76a999d5f7efde0a300e710e6f52fb0a4b61ad58",   // ✅ Updated ERC1155
                MockSpender: "0x9DBb24B10502aD166c198Dbeb5AB54d2d13AfcFd"
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
