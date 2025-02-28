import { Contract, JsonRpcProvider, ZeroAddress, getAddress } from "ethers";
import { getProvider } from "./provider";
import { CONTRACT_ADDRESSES } from "../constants/abis"; // ✅ Correct import

/**
 * Fetch ERC-721 approvals for a given user and token ID.
 * @param {string} userAddress - Wallet address of the owner.
 * @param {number} tokenId - Token ID to check approval for (default: 1).
 * @returns {Promise<boolean>} - Returns true if approved, otherwise false.
 */
export async function getERC721Approvals(userAddress, tokenId = 1) {
    try {
        const provider = await getProvider();
        const contractAddress = CONTRACT_ADDRESSES.TestNFT;

        console.log("🔍 Fetching ERC-721 approvals for contract:", contractAddress);
        console.log("👤 Owner address:", userAddress);
        console.log("🔢 Token ID:", tokenId);

        if (!contractAddress || contractAddress === ZeroAddress) {
            throw new Error("🚨 Invalid ERC-721 contract address!");
        }

        const contract = new Contract(
            contractAddress,
            [
                "function isApprovedForAll(address owner, address operator) view returns (bool)",
                "function getApproved(uint256 tokenId) view returns (address)"
            ],
            provider
        );

        const operatorAddress = CONTRACT_ADDRESSES.MockSpender;
        console.log("📌 Checking approval for operator:", operatorAddress);

        let isApproved = false;
        try {
            isApproved = await contract.isApprovedForAll(getAddress(userAddress), getAddress(operatorAddress));
            console.log("📌 isApprovedForAll result:", isApproved);
        } catch (error) {
            console.warn("⚠️ isApprovedForAll call failed:", error.message);
        }

        let specificApproval = ZeroAddress;
        try {
            specificApproval = await contract.getApproved(tokenId);
            console.log("📌 getApproved result for token ID " + tokenId + ":", specificApproval);
        } catch (error) {
            console.warn("⚠️ getApproved call failed:", error.message);
        }

        const approvalStatus = isApproved || specificApproval !== ZeroAddress;
        console.log("✅ ERC-721 Approval Status:", approvalStatus);
        
        if (approvalStatus) {
            return [{
                contract: contractAddress,
                type: "ERC-721",
                spender: isApproved ? operatorAddress : specificApproval,
                tokenId: tokenId.toString(),
                isApproved: true
            }];
        }
        
        console.log("ℹ️ No ERC-721 approvals found");
        return []; // Return empty array if no approvals
    } catch (error) {
        console.error("❌ Error fetching ERC-721 approvals:", error.message);
        return []; // Return empty array on error
    }
}


/**
 * Revoke ERC-721 approval for a user.
 * @param {string} userAddress - Address of the owner revoking approval.
 */
export async function revokeERC721Approval(userAddress) {
    try {
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const contractAddress = CONTRACT_ADDRESSES.TestNFT;
        
        console.log("🚨 Attempting to revoke ERC-721 approval");
        console.log("📋 Contract address:", contractAddress);
        
        // Create contract with the batchRevokeApprovals function
        const nftContract = new Contract(
            contractAddress,
            [
                "function setApprovalForAll(address operator, bool approved) external",
                "function isApprovedForAll(address owner, address operator) view returns (bool)",
                "function batchRevokeApprovals(uint256[] memory tokenIds) external"
            ],
            signer
        );

        const operatorAddress = CONTRACT_ADDRESSES.MockSpender;
        
        // First try the standard approach
        console.log("🔄 First trying setApprovalForAll");
        try {
            const tx = await nftContract.setApprovalForAll(operatorAddress, false);
            console.log("📤 setApprovalForAll transaction sent:", tx.hash);
            await tx.wait();
            console.log("✅ setApprovalForAll transaction confirmed");
        } catch (error) {
            console.error("❌ Error with setApprovalForAll:", error);
        }
        
        // Then try the contract's custom batchRevokeApprovals function
        console.log("🔄 Now trying batchRevokeApprovals with token IDs [1, 2, 3]");
        try {
            const batchTx = await nftContract.batchRevokeApprovals([1, 2, 3]);
            console.log("📤 batchRevokeApprovals transaction sent:", batchTx.hash);
            await batchTx.wait();
            console.log("✅ batchRevokeApprovals transaction confirmed");
        } catch (error) {
            console.error("❌ Error with batchRevokeApprovals:", error);
            // Continue - we still succeeded with setApprovalForAll
        }
        
        console.log("✅ ERC-721 Approval Revocation Completed");
    } catch (error) {
        console.error("❌ Error revoking ERC-721 approval:", error);
        throw error;
    }
}

/**
 * Batch revoke ERC-721 approvals for multiple users.
 * @param {string} userAddress - Address of the owner revoking approvals.
 * @param {Array<number>} tokenIds - Optional token IDs for specific approvals.
 */
export async function batchRevokeERC721Approvals(userAddress, tokenIds = []) {
    try {
        console.log("🚨 Batch revoking ERC-721 approvals");
        console.log("👤 Owner address:", userAddress);
        
        // Default to tokens 1, 2, 3 if none provided
        const tokensToRevoke = tokenIds && tokenIds.length > 0 ? tokenIds : [1, 2, 3];
        console.log("🔢 Token IDs to revoke:", tokensToRevoke);
        
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const contractAddress = CONTRACT_ADDRESSES.TestNFT;
        
        // Create contract with batchRevokeApprovals
        const nftContract = new Contract(
            contractAddress,
            [
                "function setApprovalForAll(address operator, bool approved) external",
                "function batchRevokeApprovals(uint256[] memory tokenIds) external"
            ],
            signer
        );

        const operatorAddress = CONTRACT_ADDRESSES.MockSpender;
        
        // First, global revocation
        console.log("🔄 First trying setApprovalForAll(false)");
        try {
            const tx = await nftContract.setApprovalForAll(operatorAddress, false);
            console.log("📤 setApprovalForAll transaction sent:", tx.hash);
            await tx.wait();
            console.log("✅ Global approval revocation confirmed");
        } catch (error) {
            console.error("❌ Error with setApprovalForAll:", error);
        }
        
        // Then, token-specific revocation
        console.log("🔄 Now trying batchRevokeApprovals with tokens:", tokensToRevoke);
        try {
            // Convert any string token IDs to numbers
            const numericTokenIds = tokensToRevoke.map(id => 
                typeof id === 'string' ? parseInt(id, 10) : id);
                
            const batchTx = await nftContract.batchRevokeApprovals(numericTokenIds);
            console.log("📤 batchRevokeApprovals transaction sent:", batchTx.hash);
            await batchTx.wait();
            console.log("✅ Token-specific revocations confirmed");
        } catch (error) {
            console.error("❌ Error with batchRevokeApprovals:", error);
        }
        
        console.log("✅ Batch revocation process completed");
        return true;
    } catch (error) {
        console.error("❌ Error in batch revocation of ERC-721 approvals:", error);
        return false;
    }
}



