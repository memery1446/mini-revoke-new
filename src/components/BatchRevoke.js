import { ethers } from "ethers";

/** Function to batch revoke ERC-20 approvals */
export async function batchRevokeERC20Approvals(tokenContracts, signer) {
    const abi = ["function approve(address spender, uint256 amount)"];

    console.log("⏳ Revoking multiple ERC-20 approvals...");

    for (let tokenAddress of tokenContracts) {
        if (!ethers.utils.isAddress(tokenAddress)) {
            console.error(`❌ Invalid token address for revoking: ${tokenAddress}`);
            continue;
        }

        try {
            const contract = new ethers.Contract(tokenAddress, abi, signer);
            const tx = await contract.approve("0x43c5df0c482c88cef8005389f64c362ee720a5bc", 0);
            await tx.wait();
            console.log(`✅ Revoked approval for ${tokenAddress}`);
        } catch (error) {
            console.error(`❌ Error revoking approval for ${tokenAddress}:`, error);
        }
    }
}
