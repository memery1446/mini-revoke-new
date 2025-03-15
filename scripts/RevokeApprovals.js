require("dotenv").config();
const { ethers, network } = require("hardhat");
const { CONTRACT_ADDRESSES, TOKEN_ABI } = require("../src/constants/abis");
const { abi: testERC1155ABI } = require("../artifacts/contracts/TestERC1155.sol/TestERC1155.json"); // ✅ Ensure correct ABI



async function main() {
  console.log("🚀 Starting revocation script...");

  const impersonatedAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; // Binance Hot Wallet

  // ✅ Step 1: Impersonate the account
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [impersonatedAddress],
  });

  const impersonatedSigner = await ethers.getSigner(impersonatedAddress);
  console.log(`📌 Impersonating: ${impersonatedSigner.address}`);

  try {
    // ✅ Step 2: Revoke ERC-20 (1INCH) Approval
    await revokeERC20(impersonatedSigner, CONTRACT_ADDRESSES.TK1);

    // ✅ Step 3: Revoke ERC-1155 (Enjin Coin) Approval
    await revokeERC1155(impersonatedSigner, CONTRACT_ADDRESSES.ERC1155);

    console.log("✅ All revocations completed successfully!");
  } catch (error) {
    console.error("❌ Error revoking approvals:", error.message);
  }

  // ✅ Step 4: Stop impersonating
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [impersonatedAddress],
  });

  console.log(`🛑 Stopped impersonating ${impersonatedAddress}`);
}

// ✅ ERC-20 Revocation
async function revokeERC20(signer, tokenAddress) {
  try {
    const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
    console.log(`🚫 Revoking ERC-20 approval at ${tokenAddress}...`);
    const tx = await contract.approve(CONTRACT_ADDRESSES.MockSpender, 0, {
      maxFeePerGas: ethers.parseUnits("25", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
    });
    await tx.wait();
    console.log(`✅ Revoked ERC-20: ${tokenAddress}`);
  } catch (error) {
    console.error(`❌ ERC-20 Revocation Failed: ${error.message}`);
  }
}

// ✅ ERC-1155 Revocation
async function revokeERC1155(signer, erc1155Address) {
  try {
    const contract = new ethers.Contract(erc1155Address, testERC1155ABI, signer); // ✅ Using Correct ABI
    console.log(`🚫 Revoking ERC-1155 approval at ${erc1155Address}...`);

    const tx = await contract.setApprovalForAll(CONTRACT_ADDRESSES.MockSpender, false, {
      maxFeePerGas: ethers.parseUnits("25", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
    });
    await tx.wait();

    console.log(`✅ Revoked ERC-1155: ${erc1155Address}`);
  } catch (error) {
    console.error(`❌ ERC-1155 Revocation Failed: ${error.message}`);
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
