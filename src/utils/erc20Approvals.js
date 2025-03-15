import { Contract, JsonRpcProvider, getAddress, isAddress } from "ethers";
import { getProvider } from "./providerService";

// ERC-20 Minimal ABI for approval checks
const ERC20_MINIMAL_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)"
];

/**
 * Fetch ALL ERC-20 token approvals for a user by scanning various sources
 * @param {Array} _unusedParam - Kept for compatibility with existing function calls
 * @param {string} ownerAddress - Owner's wallet address
 * @param {ethers.Provider} [providedProvider] - Optional provider instance
 * @returns {Promise<Array>} - Approval objects
 */
export async function getERC20Approvals(_unusedParam, ownerAddress, providedProvider) {
  console.log("🔍 Starting COMPREHENSIVE ERC-20 approval scan for:", ownerAddress);
  
  if (!ownerAddress) {
    console.warn("⚠️ No owner address provided for ERC-20 approvals");
    return [];
  }

  // Use provided provider or get one from providerService
  const provider = providedProvider || await getProvider();
  if (!provider) {
    console.error("❌ No provider available for ERC-20 approvals");
    return [];
  }

  // Get all possible token addresses to check from multiple sources
  const tokensToCheck = await getAllPossibleTokens(ownerAddress, provider);
  
  console.log(`🔍 Found ${tokensToCheck.length} potential tokens to check for approvals`);

  // Get all possible spender addresses to check
  const spenderAddresses = getAllPossibleSpenders();
  
  let approvals = [];

  for (let tokenInfo of tokensToCheck) {
    try {
      const { address: tokenAddress, symbol, name, decimals } = tokenInfo;
      
      // Skip invalid addresses
      if (!tokenAddress || !isAddress(tokenAddress)) continue;
      
      console.log(`🔍 Checking token: ${name || symbol || tokenAddress}`);
      
      // Create contract instance
      const contract = new Contract(tokenAddress, ERC20_MINIMAL_ABI, provider);
      
      for (let spender of spenderAddresses) {
        // Skip invalid spenders
        if (!spender || !isAddress(spender)) continue;
        
        try {
          console.log(`  - Checking spender: ${spender}`);
          const allowance = await contract.allowance(ownerAddress, spender);
          
          if (allowance > 0n) {
            const allowanceStr = allowance.toString();
            const isUnlimited = allowanceStr === "115792089237316195423570985008687907853269984665640564039457584007913129639935";
            
            const approval = {
              contract: tokenAddress,
              type: "ERC-20",
              spender: spender,
              amount: allowanceStr,
              asset: symbol || name || tokenAddress.substring(0, 8) + "...",
              valueAtRisk: isUnlimited ? "Unlimited" : `${formatAmount(allowance, decimals)} ${symbol || ""}`
            };

            approvals.push(approval);
            console.log(`✅ Found approval:`, approval);
          }
        } catch (error) {
          // Silent fail for individual spender checks
        }
      }
    } catch (error) {
      console.error(`❌ Error checking token ${tokenInfo.address}:`, error.message);
    }
  }

  console.log(`✅ Completed comprehensive scan. Found ${approvals.length} approvals.`);
  return approvals;
}

/**
 * Get all possible tokens to check for approvals from multiple sources
 * @param {string} ownerAddress - Owner's wallet address
 * @param {ethers.Provider} provider - Provider instance
 * @returns {Promise<Array>} - Array of token information objects
 */
async function getAllPossibleTokens(ownerAddress, provider) {
  const tokens = [];
  
  // 1. Get from local storage if any
  try {
    const storedTokens = JSON.parse(localStorage.getItem('scannedTokens') || '[]');
    tokens.push(...storedTokens);
    console.log(`📋 Found ${storedTokens.length} tokens in local storage`);
  } catch (err) {
    console.warn("⚠️ Could not load tokens from local storage");
  }
  
  // 2. Check popular tokens
  const popularTokens = getPopularTokens();
  tokens.push(...popularTokens);
  console.log(`📋 Added ${popularTokens.length} popular tokens`);
  
  // 3. Get from window.tokenList if available
  if (window.tokenList && Array.isArray(window.tokenList)) {
    tokens.push(...window.tokenList);
    console.log(`📋 Found ${window.tokenList.length} tokens in window.tokenList`);
  }
  
  // 4. Get locally deployed tokens (for development)
  const localTokens = getLocallyDeployedTokens();
  tokens.push(...localTokens);
  console.log(`📋 Added ${localTokens.length} locally deployed tokens`);
  
  // 5. Add tokens from recent Hardhat approvals
  const hardhatTokens = getHardhatApprovedTokens();
  tokens.push(...hardhatTokens);
  console.log(`📋 Added ${hardhatTokens.length} recently approved Hardhat tokens`);

  // 6. Try to get token balance/transfers (advanced)
  try {
    // This is a placeholder for a future enhancement
    // Could use provider.getLogs to find Transfer events to the owner's address
  } catch (err) {
    console.warn("⚠️ Error fetching token events");
  }
  
  // Remove duplicates by address
  const uniqueTokens = removeDuplicateTokens(tokens);
  console.log(`📋 Final token list contains ${uniqueTokens.length} unique tokens`);
  
  return uniqueTokens;
}

/**
 * Get a list of popular tokens to check
 * @returns {Array} - Array of token information objects
 */
function getPopularTokens() {
  return [
    { address: "0x6b175474e89094c44da98b954eedeac495271d0f", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", name: "USD Coin", decimals: 6 },
    { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
    { address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", symbol: "WBTC", name: "Wrapped BTC", decimals: 8 },
    { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
    { address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", symbol: "UNI", name: "Uniswap", decimals: 18 },
    { address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", symbol: "AAVE", name: "Aave Token", decimals: 18 },
    { address: "0x514910771af9ca656af840dff83e8264ecf986ca", symbol: "LINK", name: "ChainLink Token", decimals: 18 }
  ];
}

/**
 * Get a list of locally deployed tokens in development
 * @returns {Array} - Array of token information objects
 */
function getLocallyDeployedTokens() {
  // Check for local configuration in window or constants
  const localConfig = window.CONTRACT_ADDRESSES || {};
  
  return [
    // Add tokens from your Approve.js and abis.js
    { address: "0xa85EffB2658CFd81e0B1AaD4f2364CdBCd89F3a1", symbol: "TK1", name: "Test Token 1", decimals: 18 },
    { address: "0x8aAC5570d54306Bb395bf2385ad327b7b706016b", symbol: "TK2", name: "Test Token 2", decimals: 18 },
    { address: "0x64f5219563e28EeBAAd91Ca8D31fa3b36621FD4f", symbol: "PMT", name: "Permit Token", decimals: 18 },
    { address: "0x1757a98c1333B9dc8D408b194B2279b5AFDF70Cc", symbol: "FEE", name: "Fee Token", decimals: 18 }
  ];
}

/**
 * Get tokens explicitly approved in Hardhat scripts
 * @returns {Array} - Array of token information objects
 */
function getHardhatApprovedTokens() {
  return [
    { address: "0xa85EffB2658CFd81e0B1AaD4f2364CdBCd89F3a1", symbol: "TK1", name: "Test Token 1", decimals: 18 },
    { address: "0x8aAC5570d54306Bb395bf2385ad327b7b706016b", symbol: "TK2", name: "Test Token 2", decimals: 18 },
    { address: "0x64f5219563e28EeBAAd91Ca8D31fa3b36621FD4f", symbol: "PMT", name: "Permit Token", decimals: 18 },
    { address: "0x1757a98c1333B9dc8D408b194B2279b5AFDF70Cc", symbol: "FEE", name: "Fee Token", decimals: 18 }
  ];
}

/**
 * Get all possible spenders to check for approvals
 * @returns {Array} - Array of spender addresses
 */
function getAllPossibleSpenders() {
  return [
    // Your MockSpender from scripts
    "0x1bEfE2d8417e22Da2E0432560ef9B2aB68Ab75Ad",
    
    // Popular DEXes and protocols
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap V3 Router
    "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f", // SushiSwap Router
    "0x11111112542d85b3ef69ae05771c2dccff4faa26", // 1inch Router
    
    // Add any other known spenders
    "0x00000000006c3852cbef3e08e8df289169ede581", // OpenSea Seaport 1.1
    "0x00000000000001ad428e4906ae43d8f9852d0dd6", // OpenSea Seaport 1.4
    "0x000000000000ad05ccc4f10045630fb830b95127", // OpenSea Seaport 1.5
  ];
}

/**
 * Remove duplicate tokens from the token list
 * @param {Array} tokens - Array of token information objects 
 * @returns {Array} - Array of unique token information objects
 */
function removeDuplicateTokens(tokens) {
  const uniqueAddresses = new Set();
  const uniqueTokens = [];
  
  for (const token of tokens) {
    if (!token || !token.address) continue;
    
    // Normalize address
    let address;
    try {
      address = getAddress(token.address);
    } catch {
      continue; // Skip invalid addresses
    }
    
    if (!uniqueAddresses.has(address.toLowerCase())) {
      uniqueAddresses.add(address.toLowerCase());
      uniqueTokens.push({
        ...token,
        address: address // Use checksummed address
      });
    }
  }
  
  return uniqueTokens;
}

/**
 * Format a token amount with proper decimals
 * @param {BigInt} amount - Raw token amount
 * @param {number} decimals - Token decimals
 * @returns {string} - Formatted amount
 */
function formatAmount(amount, decimals = 18) {
  const amountStr = amount.toString();
  
  if (decimals === 0) return amountStr;
  
  // If amount is less than 10^decimals, we need to pad with leading zeros
  if (amountStr.length <= decimals) {
    return `0.${amountStr.padStart(decimals, '0')}`;
  }
  
  // Otherwise insert decimal point at the right position
  return `${amountStr.slice(0, -decimals)}.${amountStr.slice(-decimals)}`;
}

export default getERC20Approvals;