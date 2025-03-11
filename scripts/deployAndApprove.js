const { ethers } = require("hardhat");
const { CONTRACT_ADDRESSES } = require("../src/constants/abis");


async function main() {
  console.log("🚀 Deploying contracts & approving tokens...");

  const signers = await ethers.getSigners();
  if (!signers.length) throw new Error("❌ No signers found! Is Hardhat configured correctly?");
  
  const user = signers[0]; // The user who will receive and approve tokens
  console.log(`📌 Using user: ${user.address}`);

  const spender = CONTRACT_ADDRESSES.MockSpender;
  if (!spender) throw new Error("❌ SPENDER_ADDRESS is missing from constants/abis.js!");

  // Deploy ERC-20 Token 1
  console.log("🔄 Deploying ERC-20 Token 1...");
  const TestToken = await ethers.getContractFactory("TestToken");
  const token1 = await TestToken.deploy("TokenOne", "TK1", 18);
  await token1.waitForDeployment();
  console.log(`✅ TokenOne deployed at: ${await token1.getAddress()}`);

  // Deploy ERC-20 Token 2
  console.log("🔄 Deploying ERC-20 Token 2...");
  const token2 = await TestToken.deploy("TokenTwo", "TK2", 18);
  await token2.waitForDeployment();
  console.log(`✅ TokenTwo deployed at: ${await token2.getAddress()}`);

  // Deploy ERC-721 (NFT) Contract
  console.log("🔄 Deploying ERC-721 (NFT)...");
  const TestNFT = await ethers.getContractFactory("TestNFT");
  const nft = await TestNFT.deploy();
  await nft.waitForDeployment();
  console.log(`✅ TestNFT deployed at: ${await nft.getAddress()}`);

  // Deploy ERC-1155 Contract (Pass user.address as owner)
  console.log("🔄 Deploying ERC-1155...");
  const TestERC1155 = await ethers.getContractFactory("TestERC1155");
  const erc1155 = await TestERC1155.deploy(user.address);
  await erc1155.waitForDeployment();
  console.log(`✅ TestERC1155 deployed at: ${await erc1155.getAddress()}`);

  // Mint Tokens to the User
  console.log("💰 Minting tokens to user...");
  await token1.mint(user.address, ethers.parseUnits("1000", 18));
  await token2.mint(user.address, ethers.parseUnits("1000", 18));
  console.log("✅ Minted 1000 TK1 & TK2");

  // Mint 2 NFTs to the user
  console.log("🖼️ Minting NFTs...");
  await nft.safeMint(user.address);
  await nft.safeMint(user.address);
  console.log("✅ Minted 2 NFTs to user");

  // Mint 100 ERC-1155 tokens of ID 1 to user
  console.log("🔢 Minting ERC-1155 tokens...");
  await erc1155.mint(user.address, 1, 100);
  console.log("✅ Minted 100 ERC-1155 tokens (ID 1) to user");

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

  console.log("🎉 Deployment & approvals complete!");
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
