const { abi: testERC1155ABI } = require('../artifacts/contracts/TestERC1155.sol/TestERC1155.json');
const { abi: testTokenABI } = require('../artifacts/contracts/TestToken.sol/TestToken.json');
const { abi: testNFTABI } = require('../artifacts/contracts/TestNFT.sol/TestNFT.json');

module.exports = {
    TOKEN_ABI: testTokenABI,
    NFT_ABI: testNFTABI,
    ERC1155_ABI: testERC1155ABI, // Ensure this is exported
    CONTRACT_ADDRESSES: {
        TK1: "0xeF66010868Ff77119171628B7eFa0F6179779375",  // Updates
        TK2: "0xd544d7a5ef50c510f3e90863828eaba7e392907a",  // Updates
        TestNFT: "0x103416cfCD0D0a32b904Ab4fb69dF6E5B5aaDf2b",  // Updates
        ERC1155: "0x1f585372f116e1055af2bed81a808ddf9638dccd",  // Ensure this is the correct contract address
        MockSpender: "0x43c5df0c482c88cef8005389f64c362ee720a5bc"
    },

    NETWORK_CONFIG: {
        1337: {
            name: "Hardhat Local Fork",
            rpcUrl: "http://127.0.0.1:8545",
            contracts: {
                tokenManager: "0xeF66010868Ff77119171628B7eFa0F6179779375",  // ✅ TK1
                secondToken: "0xd544d7a5ef50c510f3e90863828eaba7e392907a",  // ✅ TK2
                erc721: "0x103416cfCD0D0a32b904Ab4fb69dF6E5B5aaDf2b",  // ✅ Updated NFT
                erc1155: "0x1f585372f116e1055af2bed81a808ddf9638dccd",   // ✅ Updated ERC1155
                MockSpender: "0x43c5df0c482c88cef8005389f64c362ee720a5bc"
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
