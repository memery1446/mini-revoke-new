require("dotenv").config();
const { ethers, network } = require("hardhat");
const { TOKEN_ABI, NFT_ABI, ERC1155_ABI, CONTRACT_ADDRESSES } = require("../src/constants/abis");

// ✅ Force Ethers v6 to accept the address
function forceChecksum(address) {
    try {
        return ethers.getAddress(address);
    } catch (error) {
        console.error(`❌ Address checksum failed: ${address}`);
        process.exit(1);
    }
}

async function main() {
  console.log("🚀 Starting approval script...");

  const impersonatedAddress = forceChecksum("0xf977814e90da44bfa03b6295a0616a897441acec");

  // Impersonate the account
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [impersonatedAddress],
  });

  const impersonatedSigner = await ethers.getSigner(impersonatedAddress);
  console.log(`📌 Impersonating: ${impersonatedSigner.address}`);

  const MaxUint256 = ethers.MaxUint256;
  const TOKEN_IDS = [1, 2]; // Sample NFT Token IDs to approve

  try {
    // ✅ Ensure all contract addresses pass the checksum
const token1Address = ethers.getAddress(CONTRACT_ADDRESSES.TK1);
const nftAddress = ethers.getAddress(CONTRACT_ADDRESSES.TestNFT);
const erc1155Address = ethers.getAddress(CONTRACT_ADDRESSES.ERC1155);


    // ✅ Approve ERC-20 Token (USDC)
    await approveERC20(token1Address, impersonatedSigner, MaxUint256);

    // ✅ Approve CryptoKitties (ERC-721)
    await approveERC721(nftAddress, impersonatedSigner, TOKEN_IDS);

    // ✅ Approve Enjin Coin (ERC-1155)
    await approveERC1155(erc1155Address, impersonatedSigner);

    console.log("✅ All approvals completed successfully!");
  } catch (error) {
    console.error("❌ Error approving tokens:", error.message);
  }

  // Stop impersonating the account
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [impersonatedAddress],
  });

  console.log(`🛑 Stopped impersonating ${impersonatedAddress}`);
}

// ✅ Fix 1: ERC-20 Approval with Checksum Address Fix
async function approveERC20(tokenAddress, impersonatedSigner, amount) {
  try {
    const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, impersonatedSigner);
    
    console.log(`💰 Approving ERC-20 token at ${tokenAddress}...`);
    const tx = await contract.approve(CONTRACT_ADDRESSES.MockSpender, ethers.MaxUint256, { // ✅ FIXED
        maxFeePerGas: ethers.parseUnits("25", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
    });
    await tx.wait();
    console.log(`✅ Approved ERC-20: ${tokenAddress}`);
  } catch (error) {
    console.error(`❌ ERC-20 Approval Failed: ${error.message}`);
  }
}


// ✅ Fix 2: ERC-721 Approval with `approve()` Instead of `setApprovalForAll()`
async function approveERC721(nftAddress, impersonatedSigner, tokenIds) {
  try {
    const contract = new ethers.Contract(nftAddress, NFT_ABI, impersonatedSigner);

    for (const tokenId of tokenIds) {
      let owner;
      try {
        owner = await contract.ownerOf(tokenId);
        console.log(`🔍 Token ID ${tokenId} is owned by: ${owner}`);
      } catch (err) {
        console.log(`⚠️ Skipping Token ID ${tokenId}: Token does not exist or contract error.`);
        continue;
      }

      if (owner.toLowerCase() !== impersonatedSigner.address.toLowerCase()) {
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

// ✅ Fix 3: ERC-1155 Approval with Checksum Address Fix
async function approveERC1155(erc1155Address, impersonatedSigner) {
  try {
    const contract = new ethers.Contract(erc1155Address, ERC1155_ABI, impersonatedSigner);
    
    console.log(`🛠️ Approving ERC-1155 for all...`);
const tx = await contract.setApprovalForAll(CONTRACT_ADDRESSES.MockSpender, true, {
    maxFeePerGas: ethers.parseUnits("25", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
});
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
