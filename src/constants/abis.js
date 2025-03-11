const { abi: testERC1155ABI } = require('../artifacts/contracts/TestERC1155.sol/TestERC1155.json');
const { abi: testTokenABI } = require('../artifacts/contracts/TestToken.sol/TestToken.json');
const { abi: testNFTABI } = require('../artifacts/contracts/TestNFT.sol/TestNFT.json');

module.exports = {
    TOKEN_ABI: testTokenABI,
    NFT_ABI: testNFTABI,
    ERC1155_ABI: testERC1155ABI,
    CONTRACT_ADDRESSES: {
        TK1: "0x2B042eF97864f2B78309BEE80Af70Aea6FFcDc79",
        TK2: "0x50AE7C0a775b2fC8Cb4089CE9F9aa3ffEc341f7b",
        TestNFT: "0xDd81A953804F8DE4942cC2DF51FC7dc7273112E2",
        ERC1155: "0xDDC69cbaD475C1477d6D7fdF7CA8580f75EC53EF",
        MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
    },

    NETWORK_CONFIG: {
1337: {
    name: "Hardhat Local Fork",
    rpcUrl: typeof window !== 'undefined' 
            ? (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com")
            : process.env.SEPOLIA_RPC_URL, 
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

