import { Contract, ZeroAddress } from "ethers";
import { getProvider } from "./provider";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { NFT_ABI } from "../constants/abis";

/**
 * Fetch ERC-721 approvals for a given user.
 * @param {string} userAddress - Wallet address of the owner.
 * @returns {Promise<Array>} - Returns array of approvals.
 */
export async function getERC721Approvals(userAddress) {
    try {
        if (!userAddress) {
            console.warn("⚠️ No user address provided for ERC-721 approvals");
            return [];
        }

        const provider = await getProvider();
        const contractAddress = CONTRACT_ADDRESSES.TestNFT;

        console.log("🔍 Fetching ERC-721 approvals for contract:", contractAddress);
        console.log("👤 Owner address:", userAddress);

        if (!contractAddress) {
            throw new Error("🚨 Invalid ERC-721 contract address!");
        }

        // Create a contract instance
        const contract = new Contract(contractAddress, NFT_ABI, provider);

        // Get the total supply of tokens
        const totalSupply = await contract.totalSupply();
        console.log("📊 Total supply of NFTs:", totalSupply.toString());

        const approvals = [];
        let approvalId = 1;

        // Check approvals for each token
        for (let tokenId = 1; tokenId <= Math.min(totalSupply, 10); tokenId++) {
            try {
                const owner = await contract.ownerOf(tokenId);
                
                // Only check approvals for tokens owned by the user
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    const approvedAddress = await contract.getApproved(tokenId);
                    
                    // Only add if there's an approval (not zero address)
                    if (approvedAddress !== ZeroAddress) {
                        approvals.push({
                            id: `erc721-${approvalId++}`,
                            contract: contractAddress,
                            type: "ERC-721",
                            spender: approvedAddress,
                            tokenId: tokenId.toString(),
                            isApproved: true
                        });
                        console.log(`✅ Token ${tokenId} is approved for ${approvedAddress}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error checking token ${tokenId}:`, error.message);
            }
        }

        // Check if approved for all
        const operators = [CONTRACT_ADDRESSES.MockSpender]; // Add any other potential operators
        
        for (const operator of operators) {
            try {
                const isApprovedForAll = await contract.isApprovedForAll(userAddress, operator);
                if (isApprovedForAll) {
                    approvals.push({
                        id: `erc721-all-${approvalId++}`,
                        contract: contractAddress,
                        type: "ERC-721",
                        spender: operator,
                        tokenId: "all",
                        isApproved: true
                    });
                    console.log(`✅ Approved for all tokens to operator: ${operator}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error checking approval for all to ${operator}:`, error.message);
            }
        }

        console.log("✅ ERC-721 Approvals:", approvals);
        return approvals;
    } catch (error) {
        console.error("❌ Error fetching ERC-721 approvals:", error.message);
        return [];
    }
}

