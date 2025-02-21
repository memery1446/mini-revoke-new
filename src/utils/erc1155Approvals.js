import { ethers } from "ethers"; // Import ethers library
import getProvider from "../utils/provider"; // Importing the default export
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis"; // Importing ABIs and addresses

const provider = getProvider(); // Get the provider
const erc1155Contract = new ethers.Contract(
    CONTRACT_ADDRESSES.ERC1155, // Ensure this points to the ERC1155 contract address
    ERC1155_ABI, // Ensure this is the correct ABI for the ERC1155 contract
    provider
);

/**
 * Fetch ERC-1155 approvals for a given owner address.
 * @param {string} ownerAddress - The address of the token owner.
 * @returns {Promise<Array>} - A promise that resolves to an array of approvals.
 */
const getERC1155Approvals = async (ownerAddress) => {
    try {
        console.log("🔍 Fetching ERC-1155 approvals for owner:", ownerAddress);
        console.log("ERC1155 Contract Address:", CONTRACT_ADDRESSES.ERC1155);

        const spenderAddresses = [
            CONTRACT_ADDRESSES.MockSpender
        ];

        let approvals = [];
        for (let spender of spenderAddresses) {
            console.log("Checking approval for spender:", spender);

            if (!ethers.utils.isAddress(ownerAddress) || !ethers.utils.isAddress(spender)) {
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
        const signer = provider.getSigner();
        const contractWithSigner = erc1155Contract.connect(signer);

        const tx = await contractWithSigner.setApprovalForAll(spenderAddress, false);
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
        const signer = provider.getSigner();
        const contractWithSigner = erc1155Contract.connect(signer);

        for (let spender of spenderAddresses) {
            if (!ethers.utils.isAddress(spender)) {
                console.error(`❌ Invalid spender address: ${spender}`);
                continue; // Skip if invalid
            }
            const tx = await contractWithSigner.setApprovalForAll(spender, false);
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
