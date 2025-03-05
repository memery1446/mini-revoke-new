require("dotenv").config();
const { ethers } = require("ethers");
const { TOKEN_ABI, NFT_ABI, ERC1155_ABI, CONTRACT_ADDRESSES } = require("../src/constants/abis");

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY_1; // Use only one key at a time
const RPC_URL = process.env.SEPOLIA_RPC_URL; // e.g., Alchemy or Infura URL

// Spender address (who we are approving)
const SPENDER = CONTRACT_ADDRESSES.MockSpender;

// ERC-721 & ERC-1155 Token IDs to Approve
const TOKEN_IDS = [1, 2];

async function main() {
    if (!PRIVATE_KEY || !RPC_URL) {
        console.error("❌ Missing environment variables. Set PRIVATE_KEY and RPC_URL in .env");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`🔹 Using wallet: ${wallet.address}`);
    
    // Approve ERC-20 Tokens
    await approveERC20(CONTRACT_ADDRESSES.TK1, wallet);
    await approveERC20(CONTRACT_ADDRESSES.TK2, wallet);

    // Approve ERC-721 NFTs
    await approveERC721(CONTRACT_ADDRESSES.TestNFT, wallet, TOKEN_IDS);

    // Approve ERC-1155 Tokens
    await approveERC1155(CONTRACT_ADDRESSES.ERC1155, wallet, TOKEN_IDS);

    console.log("✅ Approvals complete!");
}

// 🔹 Approve ERC-20 Tokens (Unlimited Approval)
async function approveERC20(tokenAddress, wallet) {
    try {
        const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
        const tx = await contract.approve(SPENDER, ethers.MaxUint256);
        console.log(`💰 Approving ERC-20 at ${tokenAddress}... TX:`, tx.hash);
        await tx.wait();
        console.log(`✅ ERC-20 Approval Confirmed: ${tokenAddress}`);
    } catch (error) {
        console.error(`❌ ERC-20 Approval Failed: ${error.message}`);
    }
}

// 🔹 Approve ERC-721 NFTs
async function approveERC721(nftAddress, wallet, tokenIds) {
    try {
        const contract = new ethers.Contract(nftAddress, NFT_ABI, wallet);

        for (const tokenId of tokenIds) {
            const tx = await contract.approve(SPENDER, tokenId);
            console.log(`🖼️ Approving ERC-721 Token ID ${tokenId}... TX:`, tx.hash);
            await tx.wait();
            console.log(`✅ ERC-721 Approval Confirmed for Token ID ${tokenId}`);
        }
    } catch (error) {
        console.error(`❌ ERC-721 Approval Failed: ${error.message}`);
    }
}

// 🔹 Approve ERC-1155 Tokens (Collection-Wide Approval)
async function approveERC1155(erc1155Address, wallet, tokenIds) {
    try {
        const contract = new ethers.Contract(erc1155Address, ERC1155_ABI, wallet);
        const tx = await contract.setApprovalForAll(SPENDER, true);
        console.log(`🛠️ Approving ERC-1155 Tokens... TX:`, tx.hash);
        await tx.wait();
        console.log(`✅ ERC-1155 Approval Confirmed for contract: ${erc1155Address}`);
    } catch (error) {
        console.error(`❌ ERC-1155 Approval Failed: ${error.message}`);
    }
}

// Run the script
main().catch(console.error);
