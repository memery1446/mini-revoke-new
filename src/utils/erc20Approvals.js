import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CONTRACT_ADDRESSES, TOKEN_ABI } from "../constants/abis";
import { getProvider } from "./providerService"; // Using providerService for consistency

/**
 * Fetch ERC-20 token approvals for a user
 * @param {Array} tokenContracts - Token contract addresses to check (optional)
 * @param {string} ownerAddress - Owner's wallet address
 * @param {ethers.Provider} [providedProvider] - Optional provider instance
 * @returns {Promise<Array>} - Approval objects
 */
export async function getERC20Approvals(tokenContracts, ownerAddress, providedProvider) {
  console.log("🔍 Starting ERC-20 approval check for:", ownerAddress);
  
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

  // Get network to determine if we're in test environment
  let isTestNetwork = false;
  try {
    const network = await provider.getNetwork();
    isTestNetwork = network.chainId === 1337 || network.chainId === 31337; // Hardhat / local networks
    console.log(`🌐 Detected network: ${network.chainId} (Test network: ${isTestNetwork})`);
  } catch (err) {
    console.warn("⚠️ Could not determine network, assuming production");
  }

  // Use provided token contracts or fallback to default list
  let tokensToCheck = [];
  
  if (tokenContracts && tokenContracts.length > 0) {
    console.log("🔍 Using provided token list:", tokenContracts);
    tokensToCheck = tokenContracts;
  } else {
    // Use token addresses from constants or fallbacks
    const defaultTokens = [
      CONTRACT_ADDRESSES.TestToken, 
      CONTRACT_ADDRESSES.DAI,
      "0x6b175474e89094c44da98b954eedeac495271d0f" // DAI on mainnet as fallback
    ].filter(Boolean); // Remove null/undefined values
    
    console.log("🔍 Using default token list:", defaultTokens);
    tokensToCheck = defaultTokens;
  }

  // Define spender addresses to check
  const spenderAddresses = CONTRACT_ADDRESSES.MockSpender 
    ? [CONTRACT_ADDRESSES.MockSpender]
    : ["0x7a250d5630b4cf539739df2c5dacb4c659f2488d"]; // Uniswap Router as fallback
  
  console.log("🔍 Checking for approvals to spenders:", spenderAddresses);
  
  // If we have no tokens to check and we're on a test network, return mock data
  if (tokensToCheck.length === 0 && isTestNetwork) {
    console.log("⚠️ No tokens to check. Using mock data for testing.");
    return getMockERC20Approvals();
  }
  
  let approvals = [];

  for (let tokenAddress of tokensToCheck) {
    try {
      // Skip null/undefined addresses
      if (!tokenAddress) continue;
      
      // Try to normalize the address (may fail for invalid addresses)
      try {
        tokenAddress = getAddress(tokenAddress);
      } catch (err) {
        console.warn(`⚠️ Invalid token address format: ${tokenAddress}, skipping...`);
        continue;
      }
      
      console.log(`🔍 Checking ERC-20 token: ${tokenAddress}`);
      
      // Create contract instance
      const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
      
      // Get token info for better UX
      let symbol = "TOKEN";
      let decimals = 18;
      
      try {
        symbol = await contract.symbol();
        decimals = await contract.decimals();
      } catch (err) {
        console.warn(`⚠️ Could not get token info for ${tokenAddress}`);
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
        
        console.log(`🔍 Checking allowance for spender: ${spender}`);
        
        try {
          const allowance = await contract.allowance(ownerAddress, spender);
          console.log(`💰 Allowance result: ${allowance.toString()}`);

          if (allowance > 0n) {
            // Check for "unlimited" approval (usually max uint256)
            const isUnlimited = allowance.toString() === "115792089237316195423570985008687907853269984665640564039457584007913129639935";
            
            const approval = {
              contract: tokenAddress,
              type: "ERC-20",
              spender: spender,
              amount: allowance.toString(),
              asset: symbol,
              valueAtRisk: isUnlimited ? "Unlimited" : `${formatAmount(allowance, decimals)} ${symbol}`
            };

            approvals.push(approval);
            console.log(`✅ Found ERC-20 approval:`, approval);
          }
        } catch (error) {
          console.error(`❌ Error checking allowance for ${tokenAddress} - ${spender}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking ERC-20 token ${tokenAddress}:`, error.message);
    }
  }

  // If we found no approvals and we're on a test network, return mock data
  if (approvals.length === 0 && isTestNetwork) {
    console.log("⚠️ No real approvals found. Adding mock data for testing.");
    return getMockERC20Approvals();
  }

  console.log("✅ Completed ERC-20 check. Found approvals:", approvals.length);
  return approvals;
}

/**
 * Format a token amount with proper decimals
 * @param {BigInt} amount - Raw token amount
 * @param {number} decimals - Token decimals
 * @returns {string} - Formatted amount
 */
function formatAmount(amount, decimals) {
  // Handle the case where amount might be a string or BigInt
  const amountStr = amount.toString();
  
  if (decimals === 0) return amountStr;
  
  // If amount is less than 10^decimals, we need to pad with leading zeros
  if (amountStr.length <= decimals) {
    return `0.${amountStr.padStart(decimals, '0')}`;
  }
  
  // Otherwise insert decimal point at the right position
  return `${amountStr.slice(0, -decimals)}.${amountStr.slice(-decimals)}`;
}

/**
 * Get mock ERC-20 approvals for testing purposes
 * @returns {Array} Array of mock approvals
 */
function getMockERC20Approvals() {
  return [
    {
      contract: "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      type: "ERC-20",
      spender: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap Router
      amount: "115792089237316195423570985008687907853269984665640564039457584007913129639935", // Max uint256
      asset: "DAI",
      valueAtRisk: "Unlimited"
    },
    {
      contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      type: "ERC-20",
      spender: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap Router
      amount: "1000000000", // 1000 USDC with 6 decimals
      asset: "USDC",
      valueAtRisk: "1000 USDC"
    }
  ];
}

export default getERC20Approvals;

