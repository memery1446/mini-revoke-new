const { ethers } = require("hardhat");
const { CONTRACT_ADDRESSES, TOKEN_ABI, NFT_ABI, ERC1155_ABI } = require("../src/constants/abis");

async function main() {
  console.log("🚀 Approving tokens...");

  const signers = await ethers.getSigners();
  if (!signers.length) throw new Error("❌ No signers found! Is Hardhat configured correctly?");
  
  const user = signers[0]; // User who will set approvals
  console.log(`📌 Using user: ${user.address}`);

  const spender = CONTRACT_ADDRESSES.MockSpender;
  if (!spender) throw new Error("❌ SPENDER_ADDRESS is missing from constants/abis.js!");

  // Check if all addresses are defined
  const requiredContracts = ["TK1", "TK2", "TestNFT", "ERC1155", "MockSpender"];
  for (const key of requiredContracts) {
    if (!CONTRACT_ADDRESSES[key]) {
      throw new Error(`❌ Missing contract address for ${key} in constants/abis.js`);
    }
  }
  console.log("✅ All contract addresses are correctly loaded.");

  // Load Deployed Contracts
  console.log("🔄 Loading deployed contracts...");
  const token1 = await ethers.getContractAt(TOKEN_ABI, CONTRACT_ADDRESSES.TK1, user);
  const token2 = await ethers.getContractAt(TOKEN_ABI, CONTRACT_ADDRESSES.TK2, user);
  const nft = await ethers.getContractAt(NFT_ABI, CONTRACT_ADDRESSES.TestNFT, user);
  const erc1155 = await ethers.getContractAt(ERC1155_ABI, CONTRACT_ADDRESSES.ERC1155, user);

  // Approve ERC-20 Tokens
  console.log("🔐 Approving ERC-20 Tokens...");
  await token1.connect(user).approve(spender, ethers.MaxUint256);
  await token2.connect(user).approve(spender, ethers.MaxUint256);
  console.log("✅ Approved TK1 & TK2");

  // Approve ERC-721 NFTs
  console.log("🔐 Approving ERC-721 NFTs...");
  await nft.connect(user).approve(spender, 1);
  await nft.connect(user).approve(spender, 2);
  console.log("✅ Approved 2 NFTs");

  // Approve ERC-1155 Collection
  console.log("🔐 Approving ERC-1155 Collection...");
  await erc1155.connect(user).setApprovalForAll(spender, true);
  console.log("✅ Approved ERC-1155 collection");

  console.log("🎉 Approvals complete!");
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
