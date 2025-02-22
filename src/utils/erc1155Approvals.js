import { isAddress, Contract } from "ethers"; // ✅ Updated import
import { getProvider } from "../utils/provider";
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis"; // Importing ABIs and addresses

/**
 * Fetch ERC-1155 approvals for a given owner address.
 * @param {string} ownerAddress - The address of the token owner.
 * @returns {Promise<Array>} - A promise that resolves to an array of approvals.
 */
const getERC1155Approvals = async (ownerAddress) => {
    try {
        console.log("🔍 Fetching ERC-1155 approvals for owner:", ownerAddress);
        console.log("ERC1155 Contract Address:", CONTRACT_ADDRESSES.ERC1155);

        const provider = await getProvider(); // ✅ Fix: Ensure async provider fetching
        const erc1155Contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ERC1155_ABI, provider);

        const spenderAddresses = [CONTRACT_ADDRESSES.MockSpender];

        let approvals = [];
        for (let spender of spenderAddresses) {
            console.log("Checking approval for spender:", spender);

            if (!isAddress(ownerAddress) || !isAddress(spender)) { // ✅ Fix `isAddress`
                console.error("❌ Invalid address provided:", { ownerAddress, spender });
                continue;
            }

            try {
                const isApproved = await erc1155Contract.isApprovedForAll(ownerAddress, spender);
                approvals.push({ spender, isApproved });
                console.log(`Approval status for ${spender}:`, isApproved);
            } catch (callError) {
                console.error(`Error calling isApprovedForAll for ${spender}:`, callError);
                console.log("Contract ABI:", JSON.stringify(ERC1155_ABI, null, 2));
            }
        }

        return approvals;
    } catch (error) {
        console.error("❌ Error fetching ERC-1155 approvals:", error);
        return [];
    }
};

/**
 * Revoke approval for a specific ERC-1155 spender address.
 * @param {string} spenderAddress - The address of the spender to revoke approval for.
 * @returns {Promise<boolean>} - A promise that resolves to true if revoked successfully, or false.
 */
async function revokeERC1155Approval(spenderAddress) {
    try {
        console.log("🚨 Revoking approval for ERC-1155 spender:", spenderAddress);

        const provider = await getProvider(); // ✅ Fix: Ensure async provider fetching
        const signer = await provider.getSigner();
        const erc1155Contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ERC1155_ABI, signer); // ✅ Fix: Move inside function

        const tx = await erc1155Contract.setApprovalForAll(spenderAddress, false);
        await tx.wait(); // Wait for transaction confirmation

        console.log("✅ Approval revoked successfully.");
        return true;
    } catch (error) {
        console.error("❌ Error revoking ERC-1155 approval:", error);
        return false; // Return false in case of an error
    }
}

/**
 * Batch revoke approvals for multiple ERC-1155 spender addresses.
 * @param {Array<string>} spenderAddresses - The array of addresses to revoke approval for.
 * @returns {Promise<boolean>} - A promise that resolves to true if all approvals are revoked successfully, or false.
 */
async function batchRevokeERC1155Approvals(spenderAddresses) {
    try {
        console.log("🚨 Revoking approvals for multiple ERC-1155 spenders:", spenderAddresses);

        const provider = await getProvider(); // ✅ Fix: Ensure async provider fetching
        const signer = await provider.getSigner();
        const erc1155Contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ERC1155_ABI, signer);

        for (let spender of spenderAddresses) {
            if (!isAddress(spender)) {  // ✅ Fix `isAddress`
                console.error(`❌ Invalid spender address: ${spender}`);
                continue; // Skip if invalid
            }

            const tx = await erc1155Contract.setApprovalForAll(spender, false);
            await tx.wait(); // Wait for transaction confirmation
        }

        console.log("✅ Batch approval revocations successful.");
        return true;
    } catch (error) {
        console.error("❌ Error in batch revoking ERC-1155 approvals:", error);
        return false; // Return false in case of an error
    }
}

// Ensure all functions are exported properly
export { getERC1155Approvals, revokeERC1155Approval, batchRevokeERC1155Approvals };
