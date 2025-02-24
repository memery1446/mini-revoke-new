import { Contract, getAddress } from "ethers";
import { getProvider } from "../utils/provider";
import { TOKEN_ABI, CONTRACT_ADDRESSES } from "../constants/abis";

/**
 * Batch revoke ERC-20 approvals.
 * @param {Array<string>} tokenContracts - List of token contract addresses.
 * @param {ethers.Signer} signer - The wallet signer executing the transactions.
 */
export async function batchRevokeERC20Approvals(tokenContracts, signer) {
    const spender = CONTRACT_ADDRESSES.MockSpender;

    console.log("⏳ Starting batch revocation for ERC-20 approvals...");
    
    for (let tokenAddress of tokenContracts) {
        try {
            if (!getAddress(tokenAddress)) {
                console.error(`❌ Invalid token address: ${tokenAddress}`);
                continue;
            }

            console.log(`🔍 Checking allowance for ${tokenAddress}...`);
            const contract = new Contract(tokenAddress, TOKEN_ABI, signer);
            const owner = await signer.getAddress();
            const currentAllowance = await contract.allowance(owner, spender);

            if (currentAllowance === 0n) {
                console.log(`🔹 Skipping ${tokenAddress}, already revoked.`);
                continue;
            }

            console.log(`🚀 Revoking approval for ${tokenAddress}...`);
            const tx = await contract.approve(spender, 0);
            await tx.wait();

            console.log(`✅ Successfully revoked approval for ${tokenAddress}`);
        } catch (error) {
            console.error(`❌ Error revoking approval for ${tokenAddress}:`, error);
        }
    }
    console.log("🎉 Batch revocation process complete!");
}

export default BatchRevoke;
