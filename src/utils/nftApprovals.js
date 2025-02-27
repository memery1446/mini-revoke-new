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
        console.log("📌 Checking approval for user:", userAddress);
        console.log("📌 Checking approval for token ID:", tokenId);

        let isApproved = false;
        try {
            isApproved = await contract.isApprovedForAll(getAddress(userAddress), getAddress(operatorAddress));
            console.log("📌 isApprovedForAll result:", isApproved);
        } catch (error) {
            console.warn("⚠️ isApprovedForAll call failed. No approvals set or contract issue.");
        }

        let specificApproval = ZeroAddress;
        try {
            specificApproval = await contract.getApproved(tokenId);
            console.log("📌 getApproved result for token ID " + tokenId + ":", specificApproval);
        } catch (error) {
            console.warn("⚠️ getApproved call failed. No approval set for token ID:", tokenId);
        }

        const approvalStatus = isApproved || specificApproval !== ZeroAddress;
        console.log("✅ ERC-721 Approval Status:", approvalStatus);
        
        // This is the crucial change - return an array of objects instead of a boolean
        if (approvalStatus) {
            return [{
                contract: contractAddress,
                spender: operatorAddress,
                tokenId: tokenId.toString(),
                isApproved: true,
                approvedAddress: isApproved ? operatorAddress : specificApproval
            }];
        }
        
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
        const nftContract = new Contract(
            contractAddress,
            [
                "function setApprovalForAll(address operator, bool approved) external"
            ],
            signer
        );

        const operatorAddress = CONTRACT_ADDRESSES.MockSpender;
        console.log("🛑 Revoking ERC-721 Approval for:", operatorAddress);

        const tx = await nftContract.setApprovalForAll(operatorAddress, false);
        await tx.wait();
        console.log("✅ ERC-721 Approval Revoked");
    } catch (error) {
        console.error("❌ Error revoking ERC-721 approval:", error);
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
        
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const contractAddress = CONTRACT_ADDRESSES.TestNFT;
        
        // Create contract instance with required methods
        const nftContract = new Contract(
            contractAddress,
            [
                "function setApprovalForAll(address operator, bool approved) external",
                "function approve(address to, uint256 tokenId) external"
            ],
            signer
        );

        const operatorAddress = CONTRACT_ADDRESSES.MockSpender;
        console.log("🔄 Revoking approval for operator:", operatorAddress);

        // First, revoke global approval (setApprovalForAll)
        const tx = await nftContract.setApprovalForAll(operatorAddress, false);
        console.log("📤 Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Global ERC-721 approval revoked");
        
        // Then revoke specific token approvals if provided
        if (tokenIds && tokenIds.length > 0) {
            console.log("🔄 Revoking approvals for specific tokens:", tokenIds);
            
            for (const tokenId of tokenIds) {
                try {
                    const specificTx = await nftContract.approve(ZeroAddress, tokenId);
                    console.log(`📤 Transaction sent for token ID ${tokenId}:`, specificTx.hash);
                    await specificTx.wait();
                    console.log(`✅ Approval revoked for token ID ${tokenId}`);
                } catch (error) {
                    console.error(`❌ Error revoking approval for token ID ${tokenId}:`, error);
                }
            }
        }
        
        console.log("✅ Batch revocation of ERC-721 approvals complete");
        return true;
    } catch (error) {
        console.error("❌ Error in batch revocation of ERC-721 approvals:", error);
        return false;
    }
}

