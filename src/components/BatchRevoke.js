import { ethers } from "ethers";

/** 
 * Function to batch revoke ERC-20 approvals.
 * @param {Array<string>} tokenContracts - List of token contract addresses.
 * @param {ethers.Signer} signer - The wallet signer executing the transactions.
 */
export async function batchRevokeERC20Approvals(tokenContracts, signer) {
    const abi = [
        "function approve(address spender, uint256 amount)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const spender = "0x9DBb24B10502aD166c198Dbeb5AB54d2d13AfcFd";

    console.log("⏳ Starting batch revocation for ERC-20 approvals...");
    
    for (let tokenAddress of tokenContracts) {
        try {
            if (!ethers.isAddress(tokenAddress)) {
                console.error(`❌ Invalid token address: ${tokenAddress}`);
                continue;
            }

            console.log(`🔍 Checking allowance for ${tokenAddress}...`);
            const contract = new ethers.Contract(tokenAddress, abi, signer);
            const owner = await signer.getAddress();
            const currentAllowance = await contract.allowance(owner, spender);

            if (currentAllowance === 0n) { // ✅ Ethers v6 requires BigInt for comparisons
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
