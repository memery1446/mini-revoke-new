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
        const provider = await getProvider(); // ✅ Ensure proper provider handling
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
        } catch (error) {
            console.warn("⚠️ isApprovedForAll call failed. No approvals set or contract issue.");
        }

        let specificApproval = ZeroAddress;
        try {
            specificApproval = await contract.getApproved(tokenId);
        } catch (error) {
            console.warn("⚠️ getApproved call failed. No approval set for token ID:", tokenId);
        }

        console.log("✅ ERC-721 Approval Status:", isApproved || specificApproval !== ZeroAddress);
        return isApproved || specificApproval !== ZeroAddress;
    } catch (error) {
        console.error("❌ Error fetching ERC-721 approvals:", error.message);
        return false;
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
 * @param {Array<string>} userAddresses - List of user addresses.
 */
export async function batchRevokeERC721Approvals(userAddresses) {
    try {
        // Ensure userAddresses is an array
        const addresses = Array.isArray(userAddresses) 
            ? userAddresses 
            : (userAddresses ? [userAddresses] : []);
        
        if (addresses.length === 0) {
            console.log("⚠️ No addresses provided for batch revocation");
            return;
        }
        
        console.log(`🔄 Attempting to revoke approvals for ${addresses.length} address(es)`);
        await Promise.all(addresses.map(revokeERC721Approval));
        console.log("✅ Batch revocation of ERC-721 approvals complete.");
    } catch (error) {
        console.error("❌ Error in batch revocation of ERC-721 approvals:", error);
    }
}
