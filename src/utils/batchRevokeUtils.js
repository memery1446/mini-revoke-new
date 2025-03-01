// batchRevokeUtils.js
import { Contract, getAddress } from "ethers";
import { TOKEN_ABI, CONTRACT_ADDRESSES } from "../constants/abis";
import { FEATURES } from "../constants/config";

/**
 * Safely normalizes an Ethereum address with error handling.
 * @param {string} address - The address to normalize.
 * @returns {string} The normalized address or the original input if invalid.
 */
function safeGetAddress(address) {
  try {
    return getAddress(address);
  } catch (error) {
    console.error(`Invalid Ethereum address: ${address}`);
    return address; // Return original to allow downstream code to handle the error
  }
}

/**
 * Batch revoke ERC-20 approvals with improved safety features.
 * @param {Array<Object>} tokenContractsWithSpenders - List of objects with token contract and spender addresses.
 * @param {ethers.Signer} signer - The wallet signer executing the transactions.
 */
export async function batchRevokeERC20Approvals(tokenContractsWithSpenders, signer) {
  console.log("⏳ Starting batch revocation for ERC-20 approvals...");
  console.log("📋 Approvals to revoke:", tokenContractsWithSpenders);
  
  // Safety check: feature flag
  if (!FEATURES.batchRevoke.enabled || !FEATURES.batchRevoke.erc20Enabled) {
    throw new Error("ERC-20 batch revocation is currently disabled.");
  }
  
  if (!signer) {
    throw new Error("No signer provided for batch revocation");
  }
  
  // Safety check: enforce batch size limit
  const maxBatchSize = FEATURES.batchRevoke.maxBatchSize || 5;
  if (tokenContractsWithSpenders.length > maxBatchSize) {
    throw new Error(`Safety limit: Cannot process more than ${maxBatchSize} approvals at once.`);
  }
  
  const ownerAddress = await signer.getAddress();
  console.log("👤 Revoking as owner:", ownerAddress);
  
  const results = {
    successful: [],
    failed: []
  };
  
  for (let i = 0; i < tokenContractsWithSpenders.length; i++) {
    const { contract: tokenAddress, spender } = tokenContractsWithSpenders[i];
    
    try {
      if (!tokenAddress || !spender) {
        console.error(`❌ Missing address data for revocation: token=${tokenAddress}, spender=${spender}`);
        results.failed.push({ tokenAddress, spender, reason: "Missing address data" });
        continue;
      }
      
      // Safely normalize addresses with error handling
      let normalizedTokenAddress, normalizedSpender;
      try {
        normalizedTokenAddress = safeGetAddress(tokenAddress);
        normalizedSpender = safeGetAddress(spender);
      } catch (error) {
        console.error(`❌ Invalid address: ${error.message}`);
        results.failed.push({ tokenAddress, spender, reason: "Invalid address format" });
        continue;
      }

      console.log(`🔍 [${i+1}/${tokenContractsWithSpenders.length}] Checking allowance for ${normalizedTokenAddress} with spender ${normalizedSpender}...`);
      
      // Try/catch for contract creation
      let contract;
      try {
        contract = new Contract(normalizedTokenAddress, TOKEN_ABI, signer);
      } catch (error) {
        console.error(`❌ Contract creation error: ${error.message}`);
        results.failed.push({ 
          tokenAddress: normalizedTokenAddress, 
          spender: normalizedSpender, 
          reason: "Failed to create contract instance" 
        });
        continue;
      }
      
      // Check current allowance with timeout protection
      let currentAllowance;
      try {
        // Add timeout for allowance check to prevent hanging
        const allowancePromise = contract.allowance(ownerAddress, normalizedSpender);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Allowance check timed out after 15 seconds")), 15000)
        );
        
        currentAllowance = await Promise.race([allowancePromise, timeoutPromise]);
        console.log(`ℹ️ Current allowance: ${currentAllowance.toString()}`);
      } catch (error) {
        console.error(`❌ Error checking allowance: ${error.message}`);
        results.failed.push({ 
          tokenAddress: normalizedTokenAddress, 
          spender: normalizedSpender, 
          reason: "Failed to check allowance: " + error.message 
        });
        continue;
      }

      if (currentAllowance === 0n) {
        console.log(`🔹 Skipping ${normalizedTokenAddress}, already revoked.`);
        results.successful.push({ 
          tokenAddress: normalizedTokenAddress, 
          spender: normalizedSpender, 
          status: "already-revoked" 
        });
        continue;
      }

      console.log(`🚀 Revoking approval for ${normalizedTokenAddress} with spender ${normalizedSpender}...`);
      
      // Gas estimation for safety
      let gasEstimate, gasLimit;
      try {
        gasEstimate = await contract.approve.estimateGas(normalizedSpender, 0);
        console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
        
        // Add 20% buffer for safety
        gasLimit = (gasEstimate * 120n) / 100n;
      } catch (error) {
        console.error(`❌ Gas estimation failed: ${error.message}`);
        results.failed.push({ 
          tokenAddress: normalizedTokenAddress, 
          spender: normalizedSpender, 
          reason: "Gas estimation failed: " + error.message 
        });
        continue;
      }
      
      // Send the transaction
      let tx;
      try {
        tx = await contract.approve(normalizedSpender, 0, { gasLimit });
        console.log(`📤 Transaction sent: ${tx.hash}`);
      } catch (error) {
        console.error(`❌ Transaction failed: ${error.message}`);
        results.failed.push({ 
          tokenAddress: normalizedTokenAddress, 
          spender: normalizedSpender, 
          reason: "Transaction failed: " + error.message 
        });
        continue;
      }
      
      // Wait for confirmation with timeout
      let receipt;
      try {
        const receiptPromise = tx.wait();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timed out after 2 minutes")), 120000)
        );
        
        receipt = await Promise.race([receiptPromise, timeoutPromise]);
        console.log(`✅ Revocation confirmed in block ${receipt.blockNumber}`);
      } catch (error) {
        console.error(`❌ Transaction confirmation failed: ${error.message}`);
        results.failed.push({ 
          tokenAddress: normalizedTokenAddress, 
          spender: normalizedSpender, 
          reason: "Transaction confirmation failed: " + error.message,
          txHash: tx.hash
        });
        continue;
      }
      
      results.successful.push({ 
        tokenAddress: normalizedTokenAddress, 
        spender: normalizedSpender, 
        txHash: tx.hash 
      });
    } catch (error) {
      console.error(`❌ Unexpected error revoking approval for token ${tokenAddress} with spender ${spender}:`, error);
      results.failed.push({ 
        tokenAddress, 
        spender, 
        reason: "Unexpected error: " + error.message 
      });
    }
  }
  
  console.log(`🎉 Batch revocation process complete! Success: ${results.successful.length}, Failed: ${results.failed.length}`);
  return results;
}

/**
 * Batch revoke ERC-721 (NFT) approvals with safety measures using standard ERC-721 methods.
 * @param {Array<Object>} nftApprovals - List of NFT approval objects with contract and tokenId.
 * @param {ethers.Signer} signer - The wallet signer executing the transactions.
 */
export async function batchRevokeNFTApprovals(nftApprovals, signer) {
  // Safety check: feature flag
  if (!FEATURES.batchRevoke.enabled || !FEATURES.batchRevoke.nftEnabled) {
    throw new Error("NFT batch revocation is currently disabled.");
  }
  
  console.log("⏳ Starting batch revocation for NFT approvals...");
  console.log("📋 NFT Approvals to revoke:", nftApprovals);
  
  if (!signer) {
    throw new Error("No signer provided for NFT batch revocation");
  }
  
  // Safety check: enforce batch size limit
  const maxBatchSize = FEATURES.batchRevoke.maxBatchSize || 5;
  if (nftApprovals.length > maxBatchSize) {
    throw new Error(`Safety limit: Cannot process more than ${maxBatchSize} NFT approvals at once.`);
  }
  
  const ownerAddress = await signer.getAddress();
  console.log("👤 Revoking as owner:", ownerAddress);
  
  const results = {
    successful: [],
    failed: []
  };
  
  // Group approvals by contract address for efficiency
  const approvalsByContract = {};
  
  // Validate and organize approvals
  for (const approval of nftApprovals) {
    // Skip 'all' tokenIds - they require setApprovalForAll
    if (approval.tokenId === 'all') {
      console.warn(`⚠️ Cannot batch revoke 'all tokens' approval: ${approval.contract}`);
      results.failed.push({
        contract: approval.contract,
        tokenId: 'all',
        reason: "Cannot batch revoke 'all tokens' approval"
      });
      continue;
    }
    
    // Validate addresses and tokenId
    try {
      const normalizedContract = safeGetAddress(approval.contract);
      
      // Parse tokenId safely
      const tokenId = parseInt(approval.tokenId, 10);
      if (isNaN(tokenId) || tokenId < 0) {
        throw new Error(`Invalid token ID: ${approval.tokenId}`);
      }
      
      // Add to grouped approvals
      if (!approvalsByContract[normalizedContract]) {
        approvalsByContract[normalizedContract] = [];
      }
      
      approvalsByContract[normalizedContract].push({
        ...approval,
        contract: normalizedContract,
        tokenId
      });
    } catch (error) {
      console.error(`❌ Validation error for NFT approval:`, error);
      results.failed.push({
        contract: approval.contract,
        tokenId: approval.tokenId,
        reason: "Validation error: " + error.message
      });
    }
  }
  
  // Import ZeroAddress from ethers if not already available
  const { ZeroAddress } = await import("ethers");
  
  // Process each contract's approvals
  for (const contractAddress of Object.keys(approvalsByContract)) {
    try {
      const approvals = approvalsByContract[contractAddress];
      if (approvals.length === 0) continue;
      
      console.log(`🔍 Processing ${approvals.length} NFT approvals for contract ${contractAddress}`);
      
      // Create contract instance with the standard ERC-721 approve function
      let nftContract;
      try {
        nftContract = new Contract(
          contractAddress,
          ["function approve(address to, uint256 tokenId) public"],
          signer
        );
      } catch (error) {
        console.error(`❌ Contract creation error: ${error.message}`);
        approvals.forEach(approval => {
          results.failed.push({
            contract: contractAddress,
            tokenId: approval.tokenId,
            reason: "Failed to create contract instance"
          });
        });
        continue;
      }
      
      // Process each token ID individually
      for (const approval of approvals) {
        try {
          console.log(`🚀 Revoking approval for NFT ${contractAddress} with token ID ${approval.tokenId}...`);
          
          // Gas estimation for safety
          let gasEstimate, gasLimit;
          try {
            gasEstimate = await nftContract.approve.estimateGas(ZeroAddress, approval.tokenId);
            console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
            
            // Add 20% buffer for safety
            gasLimit = (gasEstimate * 120n) / 100n;
          } catch (error) {
            console.error(`❌ Gas estimation failed: ${error.message}`);
            results.failed.push({ 
              contract: contractAddress, 
              tokenId: approval.tokenId,
              reason: "Gas estimation failed: " + error.message 
            });
            continue;
          }
          
          // Send the transaction
          let tx;
          try {
            console.log(`🚀 Sending revocation for NFT token ID ${approval.tokenId}...`);
            tx = await nftContract.approve(ZeroAddress, approval.tokenId, { gasLimit });
            console.log(`📤 Transaction sent: ${tx.hash}`);
          } catch (error) {
            console.error(`❌ Transaction failed: ${error.message}`);
            results.failed.push({ 
              contract: contractAddress, 
              tokenId: approval.tokenId,
              reason: "Transaction failed: " + error.message 
            });
            continue;
          }
          
          // Wait for confirmation with timeout
          let receipt;
          try {
            const receiptPromise = tx.wait();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Transaction confirmation timed out after 2 minutes")), 120000)
            );
            
            receipt = await Promise.race([receiptPromise, timeoutPromise]);
            console.log(`✅ Revocation confirmed in block ${receipt.blockNumber}`);
            
            // Mark as successful
            results.successful.push({ 
              tokenId: approval.tokenId,
              contract: contractAddress,
              txHash: tx.hash
            });
          } catch (error) {
            console.error(`❌ Transaction confirmation failed: ${error.message}`);
            results.failed.push({ 
              contract: contractAddress, 
              tokenId: approval.tokenId,
              reason: "Transaction confirmation failed: " + error.message,
              txHash: tx.hash
            });
          }
        } catch (error) {
          console.error(`❌ Unexpected error revoking NFT approval:`, error);
          results.failed.push({ 
            contract: contractAddress, 
            tokenId: approval.tokenId,
            reason: "Unexpected error: " + error.message 
          });
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error batch revoking NFT approvals for contract ${contractAddress}:`, error);
      approvalsByContract[contractAddress].forEach(approval => {
        results.failed.push({
          contract: contractAddress,
          tokenId: approval.tokenId,
          reason: "Unexpected error: " + error.message
        });
      });
    }
  }
  
  console.log(`🎉 NFT batch revocation process complete! Success: ${results.successful.length}, Failed: ${results.failed.length}`);
  return results;
}

