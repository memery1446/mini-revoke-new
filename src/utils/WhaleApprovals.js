// Create a new file: src/utils/whaleApprovals.js

import { getERC20Approvals as originalGetERC20Approvals } from "./erc20Approvals";
import { getERC721Approvals as originalGetERC721Approvals } from "./nftApprovals";
import { getERC1155Approvals as originalGetERC1155Approvals } from "./erc1155Approvals";

// The whale addresses used in our script
const WHALE_ADDRESSES = [
  "0x55fe002aeff02f77364de339a1292923a15844b8", // USDC whale
  "0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2"  // WETH whale
];

// Enhanced version that also checks whale accounts
export async function getEnhancedApprovals(connectedAccount) {
  console.log("🐳 Checking approvals for multiple accounts including whales...");
  
  // Array to store all accounts to check
  const accountsToCheck = [
    connectedAccount, // The connected wallet
    ...WHALE_ADDRESSES   // The whale addresses
  ];
  
  // Arrays to store all approvals
  let allERC20Approvals = [];
  let allERC721Approvals = [];
  let allERC1155Approvals = [];
  
  // Get approvals for all accounts
  for (const account of accountsToCheck) {
    console.log(`📋 Checking approvals for account: ${account}`);
    
    try {
      // Get ERC20 approvals
      const erc20Approvals = await originalGetERC20Approvals([], account);
      if (erc20Approvals && erc20Approvals.length > 0) {
        console.log(`✅ Found ${erc20Approvals.length} ERC20 approvals for ${account}`);
        allERC20Approvals = [...allERC20Approvals, ...erc20Approvals];
      }
    } catch (error) {
      console.error(`❌ Error fetching ERC20 approvals for ${account}:`, error);
    }
    
    try {
      // Get ERC721 approvals
      const erc721Approvals = await originalGetERC721Approvals(account);
      if (erc721Approvals && erc721Approvals.length > 0) {
        console.log(`✅ Found ${erc721Approvals.length} ERC721 approvals for ${account}`);
        allERC721Approvals = [...allERC721Approvals, ...erc721Approvals];
      }
    } catch (error) {
      console.error(`❌ Error fetching ERC721 approvals for ${account}:`, error);
    }
    
    try {
      // Get ERC1155 approvals
      const erc1155Approvals = await originalGetERC1155Approvals(account);
      if (erc1155Approvals && erc1155Approvals.length > 0) {
        console.log(`✅ Found ${erc1155Approvals.length} ERC1155 approvals for ${account}`);
        allERC1155Approvals = [...allERC1155Approvals, ...erc1155Approvals];
      }
    } catch (error) {
      console.error(`❌ Error fetching ERC1155 approvals for ${account}:`, error);
    }
  }
  
  // Return all approvals
  return {
    erc20: allERC20Approvals,
    erc721: allERC721Approvals,
    erc1155: allERC1155Approvals
  };
}
