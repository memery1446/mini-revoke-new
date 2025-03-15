import { Contract, getAddress } from "ethers";
import { NFT_ABI, CONTRACT_ADDRESSES } from "../constants/abis";
import { getProvider } from "./providerService";

/**
 * Fetch ERC-721 NFT approvals for a user
 * @param {string} ownerAddress - Owner's wallet address
 * @param {ethers.Provider} [providedProvider] - Optional provider instance
 * @returns {Promise<Array>} - Approval objects
 */
export async function getERC721Approvals(ownerAddress, providedProvider) {
  console.log("🔍 Starting ERC-721 approval check for:", ownerAddress);
  
  if (!ownerAddress) {
    console.warn("⚠️ No owner address provided for ERC-721 approvals");
    return [];
  }

  // Use provided provider or get one from providerService
  const provider = providedProvider || await getProvider();
  if (!provider) {
    console.error("❌ No provider available for ERC-721 approvals");
    return [];
  }

  // Get all NFT contract addresses - from multiple sources to be thorough
  const nftCollections = [
    // Explicitly defined NFT collections from your Approve.js script
    {
      address: CONTRACT_ADDRESSES.TestNFT || "0x6484EB0792c646A4827638Fc1B6F20461418eB00",
      symbol: "TestNFT",
      name: "Test NFT Collection"
    },
    {
      address: CONTRACT_ADDRESSES.UpgradeableNFT || "0xf201fFeA8447AB3d43c98Da3349e0749813C9009",
      symbol: "UpgradeableNFT",
      name: "Upgradeable NFT Collection"
    },
    {
      address: CONTRACT_ADDRESSES.DynamicNFT || "0xA75E74a5109Ed8221070142D15cEBfFe9642F489",
      symbol: "DynamicNFT",
      name: "Dynamic NFT Collection"
    }
  ];
  
  console.log(`🔍 Checking ${nftCollections.length} NFT collections`);

  // Define spender addresses to check (primary is MockSpender)
  const spenderAddresses = [
    CONTRACT_ADDRESSES.MockSpender || "0x1bEfE2d8417e22Da2E0432560ef9B2aB68Ab75Ad",
    // Add other common spenders like OpenSea if needed
    "0x00000000006c3852cbef3e08e8df289169ede581" // OpenSea Seaport
  ].filter(Boolean);
  
  console.log("🔍 Checking for approvals to spenders:", spenderAddresses);
  
  let approvals = [];

  // Define minimal ABI for NFT checks
  const minimalNFTABI = [
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
  ];

  for (let nftCollection of nftCollections) {
    try {
      // Skip null/undefined addresses
      if (!nftCollection.address) continue;
      
      // Normalize address
      let collectionAddress = nftCollection.address;
      try {
        collectionAddress = getAddress(collectionAddress);
      } catch (err) {
        console.warn(`⚠️ Invalid NFT address format: ${collectionAddress}, skipping...`);
        continue;
      }
      
      console.log(`🔍 Checking NFT collection: ${nftCollection.name || nftCollection.symbol || collectionAddress}`);
      
      // Use either provided ABI or minimal ABI
      const contract = new Contract(collectionAddress, NFT_ABI || minimalNFTABI, provider);
      
      // Try to get collection name/symbol if not provided
      let collectionName = nftCollection.name || "";
      let collectionSymbol = nftCollection.symbol || "";
      
      try {
        if (!collectionName) collectionName = await contract.name();
        if (!collectionSymbol) collectionSymbol = await contract.symbol();
      } catch (err) {
        console.warn(`⚠️ Could not get NFT collection info for ${collectionAddress}`);
        // Use address snippet as fallback
        collectionName = collectionName || `Collection at ${collectionAddress.substring(0, 10)}...`;
      }

      for (let spender of spenderAddresses) {
        // Skip null/undefined spenders
        if (!spender) continue;
        
        try {
          spender = getAddress(spender);
        } catch (err) {
          console.warn(`⚠️ Invalid spender address format: ${spender}, skipping...`);
          continue;
        }
        
        console.log(`🔍 Checking NFT approval for spender: ${spender}`);
        
        try {
          const isApproved = await contract.isApprovedForAll(ownerAddress, spender);
          console.log(`🖼️ isApprovedForAll result: ${isApproved}`);

          if (isApproved) {
            const approval = {
              contract: collectionAddress,
              type: "ERC-721",
              spender: spender,
              asset: collectionName || collectionSymbol,
              tokenId: "all", // Using "all" to indicate approval for all tokens
              valueAtRisk: "All NFTs in Collection"
            };

            approvals.push(approval);
            console.log(`✅ Found ERC-721 approval:`, approval);
          }
        } catch (error) {
          console.error(`❌ Error checking NFT approvals for ${collectionAddress} - ${spender}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking NFT collection ${nftCollection.address}:`, error.message);
    }
  }

  console.log("✅ Completed ERC-721 check. Found approvals:", approvals.length);
  return approvals;
}

export default getERC721Approvals;