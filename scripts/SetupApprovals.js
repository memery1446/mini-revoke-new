// scripts/SetupApprovals.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting approval setup script...");

  // Contract addresses
  const addresses = {
    TK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a",
    TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF",
    TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354",
    ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A",
    MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
  };

  // Simple ERC20 ABI for the approve function
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function symbol() view returns (string)"
  ];

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log(`Using signer address: ${signer.address}`);

  // Define the ERC20 tokens to set approvals for (TK1, TK2, and two others)
  const tokenAddresses = [
    addresses.TK1,
    addresses.TK2,
    // Let's use the same addresses again with different spenders to simulate more approvals
    addresses.TK1, 
    addresses.TK2
  ];

  // The maximum approval amount (uint256 max value)
  // For ethers v6, we use MaxUint256 directly from ethers
  const MAX_UINT256 = ethers.MaxUint256;
  
  // Loop through each token and set approval
  for (let i = 0; i < tokenAddresses.length; i++) {
    const tokenAddress = tokenAddresses[i];
    
    try {
      // Connect to the token contract
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Get token symbol if available
      let symbol;
      try {
        symbol = await tokenContract.symbol();
      } catch (err) {
        symbol = `Unknown Token ${i+1}`;
      }
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(signer.address, addresses.MockSpender);
      console.log(`Current allowance for ${symbol}: ${currentAllowance.toString()}`);
      
      if (currentAllowance > 0) {
        console.log(`Approval already exists for ${symbol}. Skipping...`);
        continue;
      }
      
      // Set approval
      console.log(`Setting approval for ${symbol} (${tokenAddress})...`);
      const tx = await tokenContract.approve(addresses.MockSpender, MAX_UINT256);
      
      console.log(`Approval transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`Approval confirmed for ${symbol}!`);
      
      // Verify approval
      const newAllowance = await tokenContract.allowance(signer.address, addresses.MockSpender);
      console.log(`New allowance for ${symbol}: ${newAllowance.toString()}`);
    } catch (error) {
      console.error(`Error setting approval for token ${tokenAddress}:`, error.message);
    }
  }

  console.log("Approval setup completed!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  