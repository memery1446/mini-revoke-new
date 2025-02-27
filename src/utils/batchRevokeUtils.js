import { Contract, getAddress } from "ethers";
import { TOKEN_ABI, CONTRACT_ADDRESSES } from "../constants/abis";

/**
 * Batch revoke ERC-20 approvals.
 * @param {Array<string>} tokenContracts - List of token contract addresses.
 * @param {ethers.Signer} signer - The wallet signer executing the transactions.
 */
export async function batchRevokeERC20Approvals(tokenContractsWithSpenders, signer) {
  console.log("⏳ Starting batch revocation for ERC-20 approvals...");
  
  for (let { contract: tokenAddress, spender } of tokenContractsWithSpenders) {
    try {
      if (!getAddress(tokenAddress) || !getAddress(spender)) {
        console.error(`❌ Invalid addresses: token=${tokenAddress}, spender=${spender}`);
        continue;
      }

      console.log(`🔍 Checking allowance for ${tokenAddress} with spender ${spender}...`);
      const contract = new Contract(tokenAddress, TOKEN_ABI, signer);
      const owner = await signer.getAddress();
      const currentAllowance = await contract.allowance(owner, spender);

      if (currentAllowance === 0n) {
        console.log(`🔹 Skipping ${tokenAddress} with spender ${spender}, already revoked.`);
        continue;
      }

      console.log(`🚀 Revoking approval for ${tokenAddress} with spender ${spender}...`);
      const tx = await contract.approve(spender, 0);
      await tx.wait();

      console.log(`✅ Successfully revoked approval for ${tokenAddress} with spender ${spender}`);
    } catch (error) {
      console.error(`❌ Error revoking approval for ${tokenAddress} with spender ${spender}:`, error);
    }
  }
  console.log("🎉 Batch revocation process complete!");
}


