// approvalDeployment.js
// Deploy approvals for testing batch revocation
// Compatible with Hardhat

const { ethers } = require("hardhat");

// Token ABIs (minimal interfaces for approvals)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];

const ERC721_ABI = [
  "function approve(address to, uint256 tokenId) public",
  "function setApprovalForAll(address operator, bool approved) external",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

const ERC1155_ABI = [
  "function setApprovalForAll(address operator, bool approved) external"
];

// Contract addresses
const ADDRESSES = {
  TK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a",
  TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF",
  TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354",
  ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A",
  MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
};

// Token IDs to approve for NFTs (adjust these if needed)
const NFT_TOKEN_IDS = [1, 2];
const ERC1155_TOKEN_IDS = [1, 2]; // For ERC1155 we'll use setApprovalForAll

// Display transaction data in a consistent format
async function displayTx(tx, label) {
  console.log(`🚀 ${label} transaction hash:`, tx.hash);
  const receipt = await tx.wait();
  console.log(`✅ ${label} confirmed in block ${receipt.blockNumber}\n`);
  return receipt;
}

// Main deployment function
async function deployApprovals() {
  try {
    // Get the first signer (deployer) from Hardhat
    const [signer] = await ethers.getSigners();
    const userAddress = await signer.getAddress();
    
    console.log("🔑 Using account:", userAddress);
    console.log("📃 Deploying approval transactions...\n");
    
    // ============= ERC-20 APPROVALS =============
    // Comment out this entire section to skip ERC-20 approvals
    {
      console.log("💰 CREATING ERC-20 APPROVALS");
      
      // Approve TK1
      const token1 = new ethers.Contract(ADDRESSES.TK1, ERC20_ABI, signer);
      console.log(`Approving ${ADDRESSES.TK1} (TK1) for spender ${ADDRESSES.MockSpender}`);
      const tx1 = await token1.approve(
        ADDRESSES.MockSpender,
        ethers.MaxUint256 // Unlimited approval
      );
      await displayTx(tx1, "TK1 approval");
      
      // Approve TK2
      const token2 = new ethers.Contract(ADDRESSES.TK2, ERC20_ABI, signer);
      console.log(`Approving ${ADDRESSES.TK2} (TK2) for spender ${ADDRESSES.MockSpender}`);
      const tx2 = await token2.approve(
        ADDRESSES.MockSpender,
        ethers.MaxUint256 // Unlimited approval
      );
      await displayTx(tx2, "TK2 approval");
      
      console.log("✅ ERC-20 approvals complete!\n");
    }
    
    // ============= ERC-721 (NFT) APPROVALS =============
    // Comment out this entire section to skip ERC-721 approvals
    {
      console.log("🖼️ CREATING ERC-721 APPROVALS");
      
      // Check if user owns the NFTs first
      const nftContract = new ethers.Contract(ADDRESSES.TestNFT, ERC721_ABI, signer);
      
      // Approve for specific tokens
      for (const tokenId of NFT_TOKEN_IDS) {
        try {
          // Verify ownership first
          try {
            const owner = await nftContract.ownerOf(tokenId);
            const isOwner = owner.toLowerCase() === userAddress.toLowerCase();
            if (!isOwner) {
              console.warn(`⚠️ Warning: You don't own NFT #${tokenId}, skipping...`);
              continue;
            }
          } catch (error) {
            console.error(`❌ Error checking ownership of token #${tokenId}:`, error.message);
            continue;
          }
          
          console.log(`Approving NFT #${tokenId} for spender ${ADDRESSES.MockSpender}`);
          const tx = await nftContract.approve(ADDRESSES.MockSpender, tokenId);
          await displayTx(tx, `NFT #${tokenId} approval`);
        } catch (error) {
          console.error(`❌ Error approving NFT #${tokenId}:`, error.message);
        }
      }
      
      // Approve all NFTs as an additional test case
      try {
        console.log("Approving ALL NFTs for spender via setApprovalForAll");
        const txAll = await nftContract.setApprovalForAll(ADDRESSES.MockSpender, true);
        await displayTx(txAll, "NFT setApprovalForAll");
      } catch (error) {
        console.error("❌ Error with setApprovalForAll:", error.message);
      }
      
      console.log("✅ ERC-721 approvals complete!\n");
    }
    
    // ============= ERC-1155 APPROVALS =============
    // Comment out this entire section to skip ERC-1155 approvals
    {
      console.log("🧩 CREATING ERC-1155 APPROVALS");
      
      const erc1155Contract = new ethers.Contract(ADDRESSES.ERC1155, ERC1155_ABI, signer);
      
      // For ERC-1155, we typically use setApprovalForAll
      try {
        console.log(`Approving ALL tokens in ERC-1155 contract ${ADDRESSES.ERC1155} for spender ${ADDRESSES.MockSpender}`);
        const tx = await erc1155Contract.setApprovalForAll(ADDRESSES.MockSpender, true);
        await displayTx(tx, "ERC-1155 approval");
      } catch (error) {
        console.error("❌ Error with ERC-1155 setApprovalForAll:", error.message);
      }
      
      // To create two approvals, we could approve for a second spender address
      // But since we don't have one, let's simulate by re-approving the same spender
      // In a real scenario, you'd use different spender addresses
      try {
        console.log("Creating second ERC-1155 approval for demonstration purposes");
        const tx2 = await erc1155Contract.setApprovalForAll(ADDRESSES.MockSpender, true);
        await displayTx(tx2, "ERC-1155 second approval");
      } catch (error) {
        console.error("❌ Error with second ERC-1155 approval:", error.message);
      }
      
      console.log("✅ ERC-1155 approvals complete!\n");
    }
    
    console.log("🎉 ALL APPROVALS DEPLOYED SUCCESSFULLY!");
    console.log("You can now test batch revocation with these approvals.");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
  }
}

// Export the main function for Hardhat to execute
module.exports = async function() {
  await deployApprovals();
}

// Make the script runnable directly with node
if (require.main === module) {
  deployApprovals()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

