// batchRevokeUtils.js
import { Contract, getAddress } from "ethers";
import { TOKEN_ABI, CONTRACT_ADDRESSES } from "../constants/abis";

/**
 * Batch revoke ERC-20 approvals.
 * @param {Array<Object>} tokenContractsWithSpenders - List of objects with token contract and spender addresses.
 * @param {ethers.Signer} signer - The wallet signer executing the transactions.
 */
export async function batchRevokeERC20Approvals(tokenContractsWithSpenders, signer) {
  console.log("⏳ Starting batch revocation for ERC-20 approvals...");
  console.log("📋 Approvals to revoke:", tokenContractsWithSpenders);
  
  if (!signer) {
    throw new Error("No signer provided for batch revocation");
  }
  
  const ownerAddress = await signer.getAddress();
  console.log("👤 Revoking as owner:", ownerAddress);
  
  const results = {
    successful: [],
    failed: []
  };
  
  for (let i = 0; i < tokenContractsWithSpenders.length; i++) {
    const { contract: tokenAddress, spender } = tokenContractsWithSpenders[i];
    
    try {
      if (!tokenAddress || !spender) {
        console.error(`❌ Missing address data for revocation: token=${tokenAddress}, spender=${spender}`);
        results.failed.push({ tokenAddress, spender, reason: "Missing address data" });
        continue;
      }
      
      const normalizedTokenAddress = getAddress(tokenAddress);
      const normalizedSpender = getAddress(spender);

      console.log(`🔍 [${i+1}/${tokenContractsWithSpenders.length}] Checking allowance for ${normalizedTokenAddress} with spender ${normalizedSpender}...`);
      
      const contract = new Contract(normalizedTokenAddress, TOKEN_ABI, signer);
      
      // Check current allowance
      const currentAllowance = await contract.allowance(ownerAddress, normalizedSpender);
      console.log(`ℹ️ Current allowance: ${currentAllowance.toString()}`);

      if (currentAllowance === 0n) {
        console.log(`🔹 Skipping ${normalizedTokenAddress}, already revoked.`);
        results.successful.push({ tokenAddress: normalizedTokenAddress, spender: normalizedSpender, status: "already-revoked" });
        continue;
      }

      console.log(`🚀 Revoking approval for ${normalizedTokenAddress} with spender ${normalizedSpender}...`);
      
      // Send the transaction
      const tx = await contract.approve(normalizedSpender, 0);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Revocation confirmed in block ${receipt.blockNumber}`);
      
      results.successful.push({ tokenAddress: normalizedTokenAddress, spender: normalizedSpender, txHash: tx.hash });
    } catch (error) {
      console.error(`❌ Error revoking approval for token ${tokenAddress} with spender ${spender}:`, error);
      results.failed.push({ tokenAddress, spender, reason: error.message });
    }
  }
  
  console.log(`🎉 Batch revocation process complete! Success: ${results.successful.length}, Failed: ${results.failed.length}`);
  return results;
}

