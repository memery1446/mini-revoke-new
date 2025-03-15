// scripts/debugApprovals-fixed.js
const { ethers } = require("hardhat");
const fs = require("fs");

// Check ethers version and setup compatibility functions
const isEthersV6 = !ethers.utils; // utils was removed in v6

// Format utilities based on ethers version
const formatEther = isEthersV6 
  ? ethers.formatEther 
  : ethers.utils.formatEther;

const formatUnits = isEthersV6
  ? ethers.formatUnits
  : ethers.utils.formatUnits;

// Constants for v6 compatibility  
const MaxUint256 = isEthersV6
  ? ethers.MaxUint256
  : ethers.constants.MaxUint256;

// Utility function to log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Also append to a debug log file
  fs.appendFileSync("debug-approvals.log", `[${timestamp}] ${message}\n`);
}

// Mock interfaces - we only need the function signatures
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)"
];

const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function isApprovedForAll(address,address) view returns (bool)",
  "function getApproved(uint256) view returns (address)"
];

const ERC1155_ABI = [
  "function uri(uint256) view returns (string)",
  "function balanceOf(address,uint256) view returns (uint256)",
  "function isApprovedForAll(address,address) view returns (bool)"
];

// Common ERC-20 tokens on Ethereum/Hardhat fork for testing
const COMMON_ERC20_TOKENS = [
  {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
    name: "Dai Stablecoin",
    symbol: "DAI"
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    name: "USD Coin",
    symbol: "USDC"
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    name: "Tether USD",
    symbol: "USDT"
  }
];

// Common ERC-721 tokens (NFT collections)
const COMMON_ERC721_TOKENS = [
  {
    address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", // BAYC
    name: "Bored Ape Yacht Club"
  },
  {
    address: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB", // CryptoPunks
    name: "CryptoPunks"
  }
];

// Check ERC-20 token approvals
async function checkERC20Approvals(walletAddress, provider) {
  log(`Checking ERC-20 approvals for ${walletAddress}`);
  const approvals = [];

  for (const token of COMMON_ERC20_TOKENS) {
    try {
      log(`Checking ${token.symbol || token.name || token.address}...`);
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      
      // Alternative: Check a few common DEXes manually
      const spenders = [
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap Router
        "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap Universal Router
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"  // SushiSwap Router
      ];
      
      for (const spender of spenders) {
        try {
          const allowance = await contract.allowance(walletAddress, spender);
          
          // Compare with MaxUint256 for unlimited approvals
          const isUnlimited = allowance.toString() === MaxUint256.toString();
          
          // We need to check if allowance is greater than 0
          // In ethers v6, we can't use gt() anymore, so we compare strings
          if (allowance.toString() !== "0") {
            log(`✅ Found approval: ${token.symbol} → ${spender.substring(0, 8)}...`);
            
            // Format based on decimals (default to 18 if not available)
            let decimals = 18;
            try {
              decimals = await contract.decimals();
            } catch (err) {
              log(`Warning: Could not get decimals for ${token.symbol}, using 18`);
            }
            
            // Add to approvals list
            approvals.push({
              type: "ERC-20",
              contract: token.address,
              spender: spender,
              asset: token.symbol || token.name,
              valueAtRisk: isUnlimited ? "Unlimited" : formatUnits(allowance, decimals)
            });
          }
        } catch (err) {
          log(`❌ Error checking ${token.symbol} allowance for ${spender}: ${err.message}`);
        }
      }
    } catch (err) {
      log(`❌ Error checking token ${token.address}: ${err.message}`);
    }
  }
  
  log(`Found ${approvals.length} ERC-20 approvals`);
  return approvals;
}

// Check ERC-721 approvals
async function checkERC721Approvals(walletAddress, provider) {
  log(`Checking ERC-721 approvals for ${walletAddress}`);
  const approvals = [];
  
  for (const collection of COMMON_ERC721_TOKENS) {
    try {
      log(`Checking NFT collection ${collection.name || collection.address}...`);
      const contract = new ethers.Contract(collection.address, ERC721_ABI, provider);
      
      // Check if operator (marketplace, etc.) is approved for all tokens
      const spenders = [
        "0x00000000006c3852cbEf3e08E8dF289169EdE581", // OpenSea Seaport
        "0x00000000000001ad428e4906aE43D8F9852d0dD6"  // LooksRare
      ];
      
      for (const spender of spenders) {
        try {
          const isApproved = await contract.isApprovedForAll(walletAddress, spender);
          if (isApproved) {
            log(`✅ Found NFT collection approval: ${collection.name} → ${spender.substring(0, 8)}...`);
            
            approvals.push({
              type: "ERC-721",
              contract: collection.address,
              spender: spender,
              asset: collection.name || "NFT Collection",
              valueAtRisk: "All NFTs"
            });
          }
        } catch (err) {
          log(`❌ Error checking NFT approval for ${spender}: ${err.message}`);
        }
      }
    } catch (err) {
      log(`❌ Error checking NFT collection ${collection.address}: ${err.message}`);
    }
  }
  
  log(`Found ${approvals.length} ERC-721 approvals`);
  return approvals;
}

// Main function
async function main() {
  log("=======================================");
  log("Starting approval debugging script (Compatible with ethers v5 & v6)");
  log(`Detected ethers version: ${isEthersV6 ? 'v6+' : 'v5'}`);
  log("=======================================");
  
  try {
    // Get provider and accounts
    const provider = ethers.provider;
    log("Provider obtained");
    
    const network = await provider.getNetwork();
    // Handle network object differences between v5 and v6
    const chainId = isEthersV6 ? network.chainId : network.chainId.toString();
    const networkName = isEthersV6 ? network.name : (network.name || 'unknown');
    
    log(`Connected to network: ${chainId} (${networkName})`);
    
    const accounts = await ethers.getSigners();
    const wallet = accounts[0];
    log(`Using wallet: ${wallet.address}`);
    
    // Get wallet balance
    const balance = await provider.getBalance(wallet.address);
    log(`Wallet balance: ${formatEther(balance)} ETH`);
    
    // Get block number
    const blockNumber = await provider.getBlockNumber();
    log(`Current block number: ${blockNumber}`);
    
    // Creating some mock approvals for testing
    log("Creating mock approvals for testing...");
    const mockApprovals = [
      {
        type: 'ERC-20',
        contract: '0x6b175474e89094c44da98b954eedeac495271d0f',
        spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        asset: 'DAI',
        valueAtRisk: 'Unlimited'
      },
      {
        type: 'ERC-721',
        contract: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        spender: '0x00000000006c3852cbef3e08e8df289169ede581',
        asset: 'BAYC',
        valueAtRisk: 'All NFTs'
      }
    ];
    
    log("Trying to check real approvals (may fail on forked network)...");
    // Try to check real approvals
    try {
      const erc20Approvals = await checkERC20Approvals(wallet.address, provider);
      const erc721Approvals = await checkERC721Approvals(wallet.address, provider);
      const realApprovals = [...erc20Approvals, ...erc721Approvals];
      
      if (realApprovals.length > 0) {
        log(`Found ${realApprovals.length} real approvals!`);
        mockApprovals.push(...realApprovals);
      } else {
        log("No real approvals found, using only mock data");
      }
    } catch (err) {
      log(`Error checking real approvals: ${err.message}`);
      log("Using only mock approvals");
    }
    
    // Write results to file
    fs.writeFileSync(
      "approvals-debug-results.json", 
      JSON.stringify(mockApprovals, null, 2)
    );
    
    log(`${mockApprovals.length} approvals (mock + real) saved to approvals-debug-results.json`);
    
    // Provide command to add these to Redux in browser
    log("\nTo add these approvals to Redux in your browser console, copy and paste:");
    log(`window.store.dispatch({ type: 'web3/setApprovals', payload: ${JSON.stringify(mockApprovals)} })`);
    
  } catch (error) {
    log(`Critical error: ${error.message}`);
    console.error(error);
  }
  
  log("=======================================");
  log("Debug script complete");
  log("=======================================");
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });