import { Contract, ZeroAddress } from "ethers";
import { getProvider } from "./provider";
import { CONTRACT_ADDRESSES, NFT_ABI } from "../constants/abis";


/**
 * Fetch ERC-721 approvals for a given user.
 * @param {string} userAddress - Wallet address of the owner.
 * @returns {Promise<Array>} - Returns array of approvals.
 */
export async function getERC721Approvals(account) {
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

        // Get the total supply of tokens - handle BigInt safely
        const totalSupplyBigInt = await contract.totalSupply();
        // Convert BigInt to Number safely for small values, or use a reasonable max
        const totalSupply = Number(totalSupplyBigInt) > Number.MAX_SAFE_INTEGER 
            ? 20 // Use a reasonable limit if the number is too large
            : Number(totalSupplyBigInt);
            
        console.log("📊 Total supply of NFTs:", totalSupply.toString());

        const approvals = [];
        let approvalId = 1;

        // Check approvals for a limited number of tokens
        // Using Math.min to ensure we don't exceed array bounds or reasonable limits
        const maxTokensToCheck = Math.min(totalSupply, 10); // Only check up to 10 tokens
        
        for (let tokenId = 1; tokenId <= maxTokensToCheck; tokenId++) {
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
                            tokenId: tokenId.toString(), // Use string to avoid BigInt issues
                            isApproved: true
                        });
                        console.log(`✅ Token ${tokenId} is approved for ${approvedAddress}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error checking token ${tokenId}:`, error.message);
            }
        }

        // Also check specific tokens we know exist (2, 3, 4)
        const specificTokens = [2, 3, 4];
        for (const tokenId of specificTokens) {
            // Skip if we already checked this token in the loop above
            if (tokenId <= maxTokensToCheck) continue;
            
            try {
                const owner = await contract.ownerOf(tokenId);
                
                if (owner.toLowerCase() === userAddress.toLowerCase()) {
                    const approvedAddress = await contract.getApproved(tokenId);
                    
                    if (approvedAddress !== ZeroAddress) {
                        approvals.push({
                            id: `erc721-specific-${approvalId++}`,
                            contract: contractAddress,
                            type: "ERC-721",
                            spender: approvedAddress,
                            tokenId: tokenId.toString(),
                            isApproved: true
                        });
                        console.log(`✅ Specific token ${tokenId} is approved for ${approvedAddress}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error checking specific token ${tokenId}:`, error.message);
            }
        }

        // Check if approved for all
        try {
            const operators = [CONTRACT_ADDRESSES.MockSpender];
            
            for (const operator of operators) {
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
            }
        } catch (error) {
            console.warn(`⚠️ Error checking "approved for all":`, error.message);
        }

        console.log("✅ ERC-721 Approvals:", approvals);
        return approvals;
    } catch (error) {
        console.error("❌ Error fetching ERC-721 approvals:", error);
        return [];
    }
}

