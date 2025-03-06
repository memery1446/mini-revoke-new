require("dotenv").config();
const { ethers } = require("hardhat");
const { TOKEN_ABI, NFT_ABI, ERC1155_ABI, CONTRACT_ADDRESSES } = require("../src/constants/abis");

async function main() {
  console.log("🚀 Starting approval script...");

  // Load signer from Hardhat using multiple private keys
  const signers = await ethers.getSigners();
  if (!signers.length) throw new Error("❌ No signers found! Is Hardhat configured correctly?");
  
  const deployer = signers[0]; // Use the first signer
  console.log(`📌 Using signer: ${deployer.address}`);

  const MAX_UINT256 = ethers.MaxUint256;
  const TOKEN_IDS = [1, 2, 3]; // Ensure we approve multiple NFTs

  try {
    // Mint NFTs before approving them
    const testNFT = await ethers.getContractAt(NFT_ABI, CONTRACT_ADDRESSES.TestNFT, deployer);
    console.log(`🔄 Minting 3 NFTs...`);
    for (let i = 0; i < 3; i++) {
      const tx = await testNFT.safeMint(deployer.address);
      await tx.wait();
      console.log(`✅ Minted NFT #${i + 1}`);
    }

    // Approve ERC-20 Tokens
    await approveERC20(CONTRACT_ADDRESSES.TK1, deployer, MAX_UINT256);
    await approveERC20(CONTRACT_ADDRESSES.TK2, deployer, MAX_UINT256);

    // Approve ERC-721 NFTs
    await approveERC721(CONTRACT_ADDRESSES.TestNFT, deployer, TOKEN_IDS);

    // Approve ERC-1155 Collection
    await approveERC1155(CONTRACT_ADDRESSES.ERC1155, deployer);

    console.log("✅ All approvals completed successfully!");
  } catch (error) {
    console.error("❌ Error approving tokens:", error.message);
  }
}



// 🔹 Approve ERC-20 Tokens
async function approveERC20(tokenAddress, deployer, amount) {
  try {
    const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, deployer);
    const allowance = await contract.allowance(deployer.address, CONTRACT_ADDRESSES.MockSpender);
    
    console.log(`🔍 Current allowance for ${tokenAddress}: ${allowance.toString()}`);
    
    if (allowance > 0) {
      console.log(`✅ ERC-20 ${tokenAddress} is already approved. Skipping...`);
      return;
    }

    console.log(`💰 Approving ERC-20 at ${tokenAddress}...`);
    const tx = await contract.approve(CONTRACT_ADDRESSES.MockSpender, amount);
    await tx.wait();
    console.log(`✅ Approved ERC-20: ${tokenAddress}`);
  } catch (error) {
    console.error(`❌ ERC-20 Approval Failed: ${error.message}`);
  }
}

// 🔹 Approve ERC-721 NFTs
async function approveERC721(nftAddress, deployer, tokenIds) {
  try {
    const contract = new ethers.Contract(nftAddress, NFT_ABI, deployer);

    for (const tokenId of tokenIds) {
      let owner;
      try {
        owner = await contract.ownerOf(tokenId);
        console.log(`🔍 Token ID ${tokenId} is owned by: ${owner}`);
      } catch (err) {
        console.log(`⚠️ Skipping Token ID ${tokenId}: Token does not exist or contract error.`);
        continue;
      }

      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log(`⚠️ Skipping approval: Not the owner of ERC-721 Token ID ${tokenId}`);
        continue;
      }

      console.log(`🖼️ Approving ERC-721 Token ID ${tokenId}...`);
      const tx = await contract.approve(CONTRACT_ADDRESSES.MockSpender, tokenId);
      await tx.wait();
      console.log(`✅ Approved ERC-721 Token ID: ${tokenId}`);
    }
  } catch (error) {
    console.error(`❌ ERC-721 Approval Failed: ${error.message}`);
  }
}

// 🔹 Approve ERC-1155 Collection
async function approveERC1155(erc1155Address, deployer) {
  try {
    const contract = new ethers.Contract(erc1155Address, ERC1155_ABI, deployer);
    console.log(`🛠️ Approving ERC-1155 for all...`);
    const tx = await contract.setApprovalForAll(CONTRACT_ADDRESSES.MockSpender, true);
    await tx.wait();
    console.log(`✅ Approved ERC-1155 for MockSpender`);
  } catch (error) {
    console.error(`❌ ERC-1155 Approval Failed: ${error.message}`);
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
