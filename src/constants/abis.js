const { abi: testERC1155ABI } = require('../artifacts/contracts/TestERC1155.sol/TestERC1155.json');
const { abi: testTokenABI } = require('../artifacts/contracts/TestToken.sol/TestToken.json');
const { abi: testNFTABI } = require('../artifacts/contracts/TestNFT.sol/TestNFT.json');

module.exports = {
    TOKEN_ABI: testTokenABI,
    NFT_ABI: testNFTABI,
    ERC1155_ABI: testERC1155ABI,
    CONTRACT_ADDRESSES: {
        TK1: "0x111111111117dC0aa78b770fA6A738034120C302", // 1INCH Token ✅ Fixed Comment
        TK2: "0x111111111117dC0aa78b770fA6A738034120C302",
        TestNFT: "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d", // CryptoKitties
        ERC1155: "0x0DB30C6CC6440E2B534D06EDF2969FCAED1C6B2B", // Enjin Coin ✅ Fixed Checksum
        MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
    },

    NETWORK_CONFIG: {
        1337: {
            name: "Hardhat Local Fork",
            rpcUrl: typeof window !== 'undefined' 
                    ? (process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545")
                    : process.env.HARDHAT_RPC_URL, 
            contracts: {
                tokenManager: "0x111111111117dC0aa78b770fA6A738034120C302",
                secondToken: "0x111111111117dC0aa78b770fA6A738034120C302",
                erc721: "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d",
                erc1155: "0x0DB30C6CC6440E2B534D06EDF2969FCAED1C6B2B", // ✅ Fixed Checksum
                MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
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
