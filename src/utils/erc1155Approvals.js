import { isAddress, Contract, getAddress } from "ethers"; 
import { getProvider } from "../utils/provider";
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis";

/**
 * 🔍 Fetch ERC-1155 approvals for a given owner.
 * @param {string} ownerAddress - The wallet address of the token owner.
 * @returns {Promise<Array>} - Resolves to an array of approvals.
 */
export async function getERC1155Approvals(ownerAddress) {
    try {
        console.log("🔍 Fetching ERC-1155 approvals for:", ownerAddress);
        const provider = await getProvider();
        const contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ERC1155_ABI, provider);

        const spender = getAddress(CONTRACT_ADDRESSES.MockSpender);
        const isApproved = await contract.isApprovedForAll(ownerAddress, spender);

        const approvals = isApproved ? [{ contract: CONTRACT_ADDRESSES.ERC1155, spender, isApproved }] : [];
        console.log("✅ Fetched ERC-1155 approvals:", approvals);
        return approvals;
    } catch (error) {
        console.error("❌ Error fetching ERC-1155 approvals:", error);
        return [];
    }
}

/**
 * 🚨 Revoke a **single** ERC-1155 approval.
 * @param {string} spenderAddress - The spender to revoke approval for.
 * @returns {Promise<boolean>} - `true` if successful, `false` otherwise.
 */
export async function revokeERC1155Approval(spenderAddress) {
    try {
        console.log("🚨 Revoking ERC-1155 approval for:", spenderAddress);
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ["function setApprovalForAll(address,bool)"], signer);

        const tx = await contract.setApprovalForAll(spenderAddress, false);
        await tx.wait();

        console.log("✅ ERC-1155 approval revoked.");
        return true;
    } catch (error) {
        console.error("❌ Error revoking ERC-1155 approval:", error);
        return false;
    }
}

/**
 * 🔄 Batch revoke **multiple** ERC-1155 approvals.
 * @param {Array<string>} spenderAddresses - Array of spender addresses to revoke approval for.
 * @returns {Promise<boolean>} - `true` if all approvals revoked, `false` otherwise.
 */
export async function revokeMultipleERC1155Approvals(spenderAddresses) {
    try {
        console.log("🚨 Revoking multiple ERC-1155 approvals:", spenderAddresses);
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const contract = new Contract(CONTRACT_ADDRESSES.ERC1155, ["function setApprovalForAll(address,bool)"], signer);

        for (let spender of spenderAddresses) {
            if (!isAddress(spender)) {
                console.error(`❌ Invalid spender address: ${spender}`);
                continue;
            }

            const tx = await contract.setApprovalForAll(spender, false);
            await tx.wait();
            console.log(`✅ Revoked ERC-1155 approval for: ${spender}`);
        }

        return true;
    } catch (error) {
        console.error("❌ Error in batch ERC-1155 revocation:", error);
        return false;
    }
}

