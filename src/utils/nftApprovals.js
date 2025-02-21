import { ethers } from "ethers";
import getProvider from "./provider"; // Ensure provider.js exists in utils
import { CONTRACT_ADDRESSES } from "../constants/abis"; // ✅ Correct import

export async function getERC721Approvals(userAddress, tokenId = 1) {
    try {
        const provider = getProvider();
        const contractAddress = CONTRACT_ADDRESSES.TestNFT;

        console.log("🔍 Fetching ERC-721 approvals for contract:", contractAddress);

        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error("🚨 Invalid ERC-721 contract address!");
        }

        const contract = new ethers.Contract(
            contractAddress,
            [
                "function isApprovedForAll(address owner, address operator) view returns (bool)",
                "function getApproved(uint256 tokenId) view returns (address)"
            ],
            provider
        );

        const operatorAddress = CONTRACT_ADDRESSES.MockSpender;
        console.log("📌 Checking approval for operator:", operatorAddress);
console.log("🔍 Fetching ERC-721 approvals for contract:", contractAddress);
console.log("📌 Checking approval for user:", userAddress);
console.log("📌 Checking approval for operator:", operatorAddress);

        let isApproved = false;
        try {
            isApproved = await contract.isApprovedForAll(userAddress, operatorAddress);
        } catch (error) {
            console.warn("⚠️ isApprovedForAll call failed, likely due to no approvals set.");
        }

        let specificApproval = "0x0000000000000000000000000000000000000000";
        try {
            specificApproval = await contract.getApproved(tokenId);
        } catch (error) {
            console.warn("⚠️ getApproved call failed, possibly no approval set for token ID:", tokenId);
        }

        console.log("✅ ERC-721 Approval Status:", isApproved || specificApproval !== "0x0000000000000000000000000000000000000000");
        return isApproved || specificApproval !== "0x0000000000000000000000000000000000000000";
    } catch (error) {
        console.error("❌ Error fetching ERC-721 approvals:", error.message);
        return false;
    }
}

export async function revokeERC721Approval(userAddress) {
    try {
        const provider = getProvider();
        const signer = provider.getSigner();
        const contractAddress = CONTRACT_ADDRESSES.TestNFT;
        const nftContract = new ethers.Contract(contractAddress, [
            "function setApprovalForAll(address operator, bool approved) external"
        ], signer);
        
        const operatorAddress = CONTRACT_ADDRESSES.MockSpender;
        console.log("🛑 Revoking ERC-721 Approval for:", operatorAddress);
        
        const tx = await nftContract.setApprovalForAll(operatorAddress, false);
        await tx.wait();
        console.log("✅ ERC-721 Approval Revoked");
    } catch (error) {
        console.error("❌ Error revoking ERC-721 approval:", error);
    }
}

export async function batchRevokeERC721Approvals(userAddresses) {
    try {
        for (const userAddress of userAddresses) {
            await revokeERC721Approval(userAddress);
        }
    } catch (error) {
        console.error("❌ Error in batch revocation of ERC-721 approvals:", error);
    }
}

