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

        const provider = await getProvider();
        const erc1155Contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ERC1155_ABI, provider);

        const spender = CONTRACT_ADDRESSES.MockSpender;
        console.log("Checking approval for spender:", spender);

        const isApproved = await erc1155Contract.isApprovedForAll(ownerAddress, spender);
        console.log(`Approval status for ${spender}:`, isApproved);

        return isApproved ? [{ spender, isApproved }] : []; // 🛠️ **Fix: Ensure revoked approvals are removed**
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

        const provider = await getProvider();
        const signer = await provider.getSigner();
        const erc1155Contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ERC1155_ABI, signer);

        for (let spender of spenderAddresses) {
            if (!isAddress(spender)) {
                console.error(`❌ Invalid spender address: ${spender}`);
                continue;
            }

            const tx = await erc1155Contract.setApprovalForAll(spender, false);
            await tx.wait();
            console.log(`✅ Approval revoked for spender: ${spender}`);
        }

        console.log("🎉 Batch approval revocations successful.");

        // 🛠️ **Force UI Refresh After Revocation**
        setTimeout(() => window.location.reload(), 1500); // ✅ Ensures UI refreshes
        return true;
    } catch (error) {
        console.error("❌ Error in batch revoking ERC-1155 approvals:", error);
        return false;
    }
}

// Ensure all functions are exported properly
export { getERC1155Approvals, revokeERC1155Approval, batchRevokeERC1155Approvals };
