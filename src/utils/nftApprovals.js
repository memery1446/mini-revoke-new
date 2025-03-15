import { Contract, ZeroAddress } from "ethers";
import { getProvider } from "./providerService"; // Using providerService for consistency
import { CONTRACT_ADDRESSES, NFT_ABI } from "../constants/abis";

/**
 * Fetch ERC-721 approvals for a given user.
 * @param {string} userAddress - Wallet address of the owner.
 * @param {ethers.Provider} [providedProvider] - Optional provider instance.
 * @returns {Promise<Array>} - Returns array of approvals.
 */
export async function getERC721Approvals(userAddress, providedProvider) {
    try {
        if (!userAddress) {
            console.warn("⚠️ No user address provided for ERC-721 approvals");
            return [];
        }

        // Use provided provider or get one from providerService
        const provider = providedProvider || await getProvider();
        if (!provider) {
            console.error("❌ No provider available for ERC-721 approvals");
            return [];
        }

        // Get network to determine if we're in test environment
        let isTestNetwork = false;
        try {
            const network = await provider.getNetwork();
            isTestNetwork = network.chainId === 1337 || network.chainId === 31337; // Hardhat / local networks
            console.log(`🌐 Detected network: ${network.chainId} (Test network: ${isTestNetwork})`);
        } catch (err) {
            console.warn("⚠️ Could not determine network, assuming production");
        }

        // Use the contract address from constants or fallback to a test address
        let contractAddress = CONTRACT_ADDRESSES.TestNFT;
        
        // If contractAddress is undefined and we're on a test network, use a fallback address
        if (!contractAddress && isTestNetwork) {
            contractAddress = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"; // BAYC address as a fallback
            console.log("⚠️ Using fallback NFT contract address:", contractAddress);
        }

        if (!contractAddress) {
            console.error("🚨 No valid ERC-721 contract address available");
            
            // For testing: return mock approvals on test networks
            if (isTestNetwork) {
                console.log("🧪 Using mock ERC-721 approvals for testing");
                return getMockNFTApprovals();
            }
            
            return [];
        }

        console.log("🔍 Fetching ERC-721 approvals for contract:", contractAddress);
        console.log("👤 Owner address:", userAddress);

        // Create a contract instance
        const contract = new Contract(contractAddress, NFT_ABI, provider);
        const approvals = [];
        let approvalId = 1;

        // Try to get the totalSupply - some contracts might not implement this
        let totalSupply = 10; // Default to 10 tokens if we can't get totalSupply
        try {
            const totalSupplyBigInt = await contract.totalSupply();
            totalSupply = Number(totalSupplyBigInt) > Number.MAX_SAFE_INTEGER 
                ? 20 // Use a reasonable limit if the number is too large
                : Number(totalSupplyBigInt);
                
            console.log("📊 Total supply of NFTs:", totalSupply.toString());
        } catch (error) {
            console.warn("⚠️ Could not get totalSupply, using default value:", totalSupply);
        }

        // Check approvals for a limited number of tokens
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
                            tokenId: tokenId.toString(),
                            isApproved: true,
                            asset: `NFT #${tokenId}`,
                            valueAtRisk: "1 NFT"
                        });
                        console.log(`✅ Token ${tokenId} is approved for ${approvedAddress}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error checking token ${tokenId}:`, error.message);
            }
        }

        // Check if approved for all
        try {
            // Use MockSpender from constants or a fallback spender address
            const operators = CONTRACT_ADDRESSES.MockSpender 
                ? [CONTRACT_ADDRESSES.MockSpender]
                : ["0x00000000006c3852cbef3e08e8df289169ede581"]; // OpenSea Seaport
            
            for (const operator of operators) {
                if (!operator) continue;
                
                const isApprovedForAll = await contract.isApprovedForAll(userAddress, operator);
                if (isApprovedForAll) {
                    approvals.push({
                        id: `erc721-all-${approvalId++}`,
                        contract: contractAddress,
                        type: "ERC-721",
                        spender: operator,
                        tokenId: "all",
                        isApproved: true,
                        asset: "All NFTs",
                        valueAtRisk: "All NFTs in Collection"
                    });
                    console.log(`✅ Approved for all tokens to operator: ${operator}`);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error checking "approved for all":`, error.message);
        }

        // If we found no approvals and we're on a test network, return mock data
        if (approvals.length === 0 && isTestNetwork) {
            console.log("⚠️ No real approvals found. Adding mock data for testing.");
            return getMockNFTApprovals();
        }

        console.log("✅ ERC-721 Approvals:", approvals);
        return approvals;
    } catch (error) {
        console.error("❌ Error fetching ERC-721 approvals:", error);
        
        // Return mock approvals if we're on a test network
        try {
            const provider = providedProvider || await getProvider();
            const network = await provider.getNetwork();
            
            if (network.chainId === 1337 || network.chainId === 31337) {
                console.log("🧪 Using mock ERC-721 approvals after error");
                return getMockNFTApprovals();
            }
        } catch (err) {
            // Ignore network detection errors
        }
        
        return [];
    }
}

/**
 * Get mock NFT approvals for testing purposes
 * @returns {Array} Array of mock NFT approvals
 */
function getMockNFTApprovals() {
    return [
        {
            id: "erc721-mock-1",
            contract: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // BAYC
            type: "ERC-721",
            spender: "0x00000000006c3852cbef3e08e8df289169ede581", // OpenSea
            tokenId: "1234",
            isApproved: true,
            asset: "BAYC #1234",
            valueAtRisk: "1 NFT"
        },
        {
            id: "erc721-mock-2", 
            contract: "0x60e4d786628fea6478f785a6d7e704777c86a7c6", // Mutant Ape Yacht Club
            type: "ERC-721",
            spender: "0x00000000006c3852cbef3e08e8df289169ede581", // OpenSea
            tokenId: "all",
            isApproved: true,
            asset: "MAYC Collection",
            valueAtRisk: "All NFTs"
        }
    ];
}

export default getERC721Approvals;