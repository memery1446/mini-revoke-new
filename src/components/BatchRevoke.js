// BatchRevoke.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { batchRevokeERC20Approvals, batchRevokeNFTApprovals } from '../utils/batchRevokeUtils';
import { getProvider } from '../utils/provider';
import { setApprovals } from "../store/web3Slice";
import { FEATURES } from '../constants/config';
import { getERC20Approvals } from '../utils/erc20Approvals';
import { getERC721Approvals } from '../utils/nftApprovals';
import { getERC1155Approvals } from '../utils/erc1155Approvals';
import { Contract, ZeroAddress } from 'ethers';
import { ERC20_ABI, NFT_ABI, ERC1155_ABI } from "../constants/abis";

const BatchRevoke = () => {
  // Don't render anything if feature is disabled
  if (!FEATURES.batchRevoke.enabled) {
    return null;
  }

  const dispatch = useDispatch();
  const approvals = useSelector((state) => state.web3.approvals);
  const wallet = useSelector((state) => state.web3.account);

  // 🔥 Debugging Hook: Log approvals whenever they change
  useEffect(() => {
    console.log("🔄 Approvals updated, triggering re-render:", approvals);
  }, [approvals]);  

  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isRevoking, setIsRevoking] = useState(false);
  const [results, setResults] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // Default to showing all approvals
  const [progress, setProgress] = useState({ current: 0, total: 0, processing: false, status: "" });

  // Maximum batch size from feature settings
  const maxBatchSize = FEATURES.batchRevoke.maxBatchSize || 5;
  const isBatchSizeExceeded = selectedApprovals.length > maxBatchSize;
  
  // Filter approvals based on enabled features
  const erc20Approvals = FEATURES.batchRevoke.erc20Enabled 
    ? approvals.filter(a => a.type === 'ERC-20')
    : [];
  
  const nftApprovals = FEATURES.batchRevoke.nftEnabled 
    ? approvals.filter(a => a.type === 'ERC-721')
    : [];

  const erc1155Approvals = FEATURES.batchRevoke.erc1155Enabled 
    ? approvals.filter(a => a.type === 'ERC-1155')
    : [];

  // All approvals in one list for the "All" tab
  const allApprovals = [...erc20Approvals, ...nftApprovals, ...erc1155Approvals];

  // Advanced selection logic that works across token types
  const handleSelectApproval = (approval) => {
    console.log("🔍 Toggling selection for:", approval);
    
    setSelectedApprovals((prev) => {
      // Different selection logic based on approval type
      let isSelected;
      
      if (approval.type === 'ERC-20') {
        // For ERC-20, check contract and spender only
        isSelected = prev.some((a) => 
          a.type === 'ERC-20' &&
          a.contract === approval.contract && 
          a.spender === approval.spender
        );
      } else if (approval.type === 'ERC-721') {
        // For NFTs, also check tokenId to handle individual token approvals
        isSelected = prev.some((a) => 
          a.type === 'ERC-721' &&
          a.contract === approval.contract && 
          a.spender === approval.spender && 
          a.tokenId === approval.tokenId
        );
      } else if (approval.type === 'ERC-1155') {
        // For ERC-1155, check contract and spender
        isSelected = prev.some((a) => 
          a.type === 'ERC-1155' &&
          a.contract === approval.contract && 
          a.spender === approval.spender
        );
      }
      
      if (isSelected) {
        // Remove if already selected - with proper type handling
        if (approval.type === 'ERC-721') {
          return prev.filter((a) => 
            !(a.type === 'ERC-721' &&
              a.contract === approval.contract && 
              a.spender === approval.spender && 
              a.tokenId === approval.tokenId)
          );
        } else {
          return prev.filter((a) => 
            !(a.type === approval.type &&
              a.contract === approval.contract && 
              a.spender === approval.spender)
          );
        }
      } else {
        // Add if not selected, but respect the max batch size
        if (prev.length >= maxBatchSize) {
          console.warn(`⚠️ Maximum selection of ${maxBatchSize} reached`);
          return prev;
        }
        return [...prev, approval];
      }
    });
  };

  // Estimate gas for better UX and safety
  const estimateGas = async () => {
    if (selectedApprovals.length === 0) return;
    
    try {
      setGasEstimate({ status: 'loading' });
      
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      // Split approvals by type
      const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
      const nftApprovals = selectedApprovals.filter(a => a.type === 'ERC-721');
      const erc1155Approvals = selectedApprovals.filter(a => a.type === 'ERC-1155');
      
      let totalGasEstimate = 0n;
      let estimationErrors = [];
      
      // Calculate ERC-20 gas estimates
      if (erc20Approvals.length > 0) {
        for (const approval of erc20Approvals) {
          try {
            const contract = new Contract(approval.contract, ERC20_ABI, signer);
            const gasEstimate = await contract.approve.estimateGas(approval.spender, 0);
            totalGasEstimate += gasEstimate;
          } catch (error) {
            estimationErrors.push(`ERC-20 (${approval.contract.substring(0, 8)}...): ${error.message}`);
          }
        }
      }
      
      // Calculate NFT gas estimates
      if (nftApprovals.length > 0) {
        for (const approval of nftApprovals) {
          try {
            const contract = new Contract(approval.contract, NFT_ABI, signer);
            
            if (approval.tokenId === 'all') {
              // For "approve all" operations
              const gasEstimate = await contract.setApprovalForAll.estimateGas(approval.spender, false);
              totalGasEstimate += gasEstimate;
            } else {
              // For individual token approvals
              const gasEstimate = await contract.approve.estimateGas(ZeroAddress, approval.tokenId);
              totalGasEstimate += gasEstimate;
            }
          } catch (error) {
            estimationErrors.push(`NFT (${approval.contract.substring(0, 8)}...): ${error.message}`);
          }
        }
      }
      
      // Calculate ERC-1155 gas estimates
      if (erc1155Approvals.length > 0) {
        for (const approval of erc1155Approvals) {
          try {
            const contract = new Contract(approval.contract, ERC1155_ABI, signer);
            const gasEstimate = await contract.setApprovalForAll.estimateGas(approval.spender, false);
            totalGasEstimate += gasEstimate;
          } catch (error) {
            estimationErrors.push(`ERC-1155 (${approval.contract.substring(0, 8)}...): ${error.message}`);
          }
        }
      }
      
      // Get current gas price
      const gasPrice = await provider.getGasPrice();
      const gasPriceInGwei = Number(gasPrice) / 1e9;
      const estimatedCostWei = totalGasEstimate * gasPrice;
      const estimatedCostEth = Number(estimatedCostWei) / 1e18;
      
      setGasEstimate({
        status: 'success',
        totalGas: totalGasEstimate.toString(),
        gasPriceGwei: gasPriceInGwei.toFixed(2),
        costEth: estimatedCostEth.toFixed(6),
        costUsd: (estimatedCostEth * 3000).toFixed(2), // Rough USD estimate
        errors: estimationErrors
      });
      
    } catch (error) {
      console.error("Error estimating gas:", error);
      setGasEstimate({
        status: 'error',
        message: error.message
      });
    }
  };

  // Request revocation with confirmation
  const handleRevocationRequest = async () => {
    if (selectedApprovals.length === 0) {
      console.log("⚠️ No approvals selected");
      return;
    }
    
    if (isBatchSizeExceeded) {
      setResults({
        success: false,
        message: `Safety limit: Maximum ${maxBatchSize} approvals can be revoked at once`
      });
      return;
    }
    
    // If gas estimation is enabled, do that first
    if (FEATURES.batchRevoke.showGasEstimates) {
      await estimateGas();
    }
    
    // If confirmation is required, show dialog
    if (FEATURES.batchRevoke.requireConfirmation) {
      setShowConfirmation(true);
    } else {
      // Otherwise proceed directly
      executeBatchRevoke();
    }
  };

  // Helper function for ERC-1155 revocation
  const revokeERC1155Approval = async (approval, signer) => {
    try {
      console.log(`🔄 Revoking ERC-1155 approval for ${approval.contract} with spender ${approval.spender}`);
      
      const contract = new Contract(approval.contract, ERC1155_ABI, signer);
      
      // Gas estimation for safety
      let gasEstimate, gasLimit;
      try {
        gasEstimate = await contract.setApprovalForAll.estimateGas(approval.spender, false);
        console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
        
        // Add 20% buffer for safety
        gasLimit = (gasEstimate * 120n) / 100n;
      } catch (error) {
        throw new Error(`Gas estimation failed: ${error.message}`);
      }
      
      // Send transaction
      const tx = await contract.setApprovalForAll(approval.spender, false, { gasLimit });
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation with timeout
      const receiptPromise = tx.wait();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Transaction confirmation timed out after 2 minutes")), 120000)
      );
      
      const receipt = await Promise.race([receiptPromise, timeoutPromise]);
      console.log(`✅ ERC-1155 revocation confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error(`❌ ERC-1155 revocation error: ${error.message}`);
      throw error;
    }
  };

  // Execute batch revocation with progress tracking
  const executeBatchRevoke = async () => {
    setShowConfirmation(false);
    setIsRevoking(true);
    setResults(null);
    
    // Setup progress tracking
    const totalApprovals = selectedApprovals.length;
    setProgress({ 
      current: 0, 
      total: totalApprovals,
      processing: true,
      status: "Preparing to revoke approvals..."
    });
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      console.log("🔄 Starting batch revocation with signer:", await signer.getAddress());
      
      // Split approvals by type
      const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
      const nftApprovals = selectedApprovals.filter(a => a.type === 'ERC-721' && a.tokenId !== 'all');
      const nftApproveAllApprovals = selectedApprovals.filter(a => a.type === 'ERC-721' && a.tokenId === 'all');
      const erc1155Approvals = selectedApprovals.filter(a => a.type === 'ERC-1155');
      
      // Initialize results
      const results = {
        successful: [],
        failed: []
      };
      
      // 1. Process ERC-20 approvals
      if (erc20Approvals.length > 0) {
        setProgress({ 
          ...progress, 
          status: `Revoking ${erc20Approvals.length} ERC-20 approvals...` 
        });
        
        console.log("🚀 Revoking ERC-20 approvals:", erc20Approvals);
        try {
          const erc20Results = await batchRevokeERC20Approvals(erc20Approvals, signer);
          results.successful.push(...erc20Results.successful);
          results.failed.push(...erc20Results.failed);
          
          setProgress({ 
            current: results.successful.length + results.failed.length, 
            total: totalApprovals,
            processing: true,
            status: `Completed ${results.successful.length} of ${totalApprovals} approvals` 
          });
        } catch (error) {
          console.error("ERC-20 batch revocation error:", error);
          // Mark all as failed
          results.failed.push(...erc20Approvals.map(a => ({
            tokenAddress: a.contract,
            spender: a.spender,
            type: 'ERC-20',
            reason: error.message
          })));
        }
      }
      
      // 2. Process NFT approvals for individual tokens
      if (nftApprovals.length > 0) {
        setProgress({ 
          ...progress, 
          status: `Revoking ${nftApprovals.length} NFT approvals...` 
        });
        
        console.log("🚀 Revoking NFT approvals:", nftApprovals);
        try {
          const nftResults = await batchRevokeNFTApprovals(nftApprovals, signer);
          results.successful.push(...nftResults.successful.map(r => ({...r, type: 'ERC-721'})));
          results.failed.push(...nftResults.failed.map(r => ({...r, type: 'ERC-721'})));
          
          setProgress({ 
            current: results.successful.length + results.failed.length, 
            total: totalApprovals,
            processing: true,
            status: `Completed ${results.successful.length} of ${totalApprovals} approvals` 
          });
        } catch (error) {
          console.error("NFT batch revocation error:", error);
          // Mark all as failed
          results.failed.push(...nftApprovals.map(a => ({
            contract: a.contract,
            tokenId: a.tokenId,
            spender: a.spender,
            type: 'ERC-721',
            reason: error.message
          })));
        }
      }
      
      // 3. Process "approve all" NFT approvals one by one
      for (let i = 0; i < nftApproveAllApprovals.length; i++) {
        const approval = nftApproveAllApprovals[i];
        setProgress({ 
          current: results.successful.length + results.failed.length, 
          total: totalApprovals,
          processing: true,
          status: `Revoking "approve all" for NFT contract ${i+1}/${nftApproveAllApprovals.length}...`
        });
        
        try {
          console.log(`🔄 Revoking "approve all" for NFT contract ${approval.contract} with spender ${approval.spender}`);
          
          const contract = new Contract(approval.contract, NFT_ABI, signer);
          const tx = await contract.setApprovalForAll(approval.spender, false);
          await tx.wait();
          
          results.successful.push({
            contract: approval.contract,
            tokenId: 'all',
            spender: approval.spender,
            type: 'ERC-721',
            txHash: tx.hash
          });
        } catch (error) {
          console.error(`Error revoking "approve all" for NFT:`, error);
          results.failed.push({
            contract: approval.contract,
            tokenId: 'all',
            spender: approval.spender,
            type: 'ERC-721',
            reason: error.message
          });
        }
      }
      
      // 4. Process ERC-1155 approvals one by one
      for (let i = 0; i < erc1155Approvals.length; i++) {
        const approval = erc1155Approvals[i];
        setProgress({ 
          current: results.successful.length + results.failed.length, 
          total: totalApprovals,
          processing: true,
          status: `Revoking ERC-1155 approval ${i+1}/${erc1155Approvals.length}...`
        });
        
        try {
          const result = await revokeERC1155Approval(approval, signer);
          results.successful.push({
            contract: approval.contract,
            spender: approval.spender,
            type: 'ERC-1155',
            txHash: result.txHash
          });
        } catch (error) {
          console.error(`Error revoking ERC-1155 approval:`, error);
          results.failed.push({
            contract: approval.contract,
            spender: approval.spender,
            type: 'ERC-1155',
            reason: error.message
          });
        }
      }
      
      // Final results
      const combinedResults = {
        success: results.failed.length === 0,
        failed: results.failed.length,
        successful: results.successful.length,
        details: results
      };
      
      setResults(combinedResults);
      setProgress({ 
        current: totalApprovals, 
        total: totalApprovals,
        processing: false,
        status: "All approvals processed!"
      });
      
      // Update the Redux store to remove successfully revoked approvals
      setTimeout(() => {
        // Filter out revoked approvals
        const updatedApprovals = approvals.filter(approval => {
          // For ERC-20, check if it was successfully revoked
          if (approval.type === 'ERC-20') {
            return !results.successful.some(
              result => 
                result.type === 'ERC-20' &&
                result.tokenAddress === approval.contract && 
                result.spender === approval.spender
            );
          }
          
          // For NFT, check if it was successfully revoked
          if (approval.type === 'ERC-721') {
            return !results.successful.some(
              result => 
                result.type === 'ERC-721' &&
                result.contract === approval.contract && 
                result.spender === approval.spender &&
                String(result.tokenId) === approval.tokenId
            );
          }
          
          // For ERC-1155, check if it was successfully revoked
          if (approval.type === 'ERC-1155') {
            return !results.successful.some(
              result => 
                result.type === 'ERC-1155' &&
                result.contract === approval.contract && 
                result.spender === approval.spender
            );
          }
        
          // Keep other approvals
          return true;
        });
        
        // Update Redux
        dispatch(setApprovals(updatedApprovals));
      }, 2000);
      
      // Clear selections on success
      setSelectedApprovals([]);
      
    } catch (error) {
      console.error("❌ Batch revocation error:", error);
      setResults({
        success: false,
        message: error.message || "Failed to revoke approvals"
      });
      setProgress({ 
        ...progress, 
        processing: false,
        status: "Error during revocation process"
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Calculate counts for UI
  const isAnySelected = selectedApprovals.length > 0;
  const selectedERC20Count = selectedApprovals.filter(a => a.type === 'ERC-20').length;
  const selectedNFTCount = selectedApprovals.filter(a => a.type === 'ERC-721').length;
  const selectedERC1155Count = selectedApprovals.filter(a => a.type === 'ERC-1155').length;
  
  // Refresh approvals from blockchain
  const refreshBatchRevoke = async () => {
    if (isRevoking || !wallet) return;
    
    setIsRevoking(true);

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("🔄 Refreshing approvals for:", address);

      // Fetch approvals for all token types
      const erc20Approvals = FEATURES.batchRevoke.erc20Enabled 
        ? await getERC20Approvals([], address) || []
        : [];
      
      const nftApprovals = FEATURES.batchRevoke.nftEnabled 
        ? await getERC721Approvals(address) || []
        : [];
        
      const erc1155Approvals = FEATURES.batchRevoke.erc1155Enabled 
        ? await getERC1155Approvals(address) || []
        : [];

      console.log("📜 Fetched ERC-20 Approvals:", erc20Approvals);
      console.log("🎨 Fetched ERC-721 Approvals:", nftApprovals);
      console.log("🧰 Fetched ERC-1155 Approvals:", erc1155Approvals);
      
      // Tag approvals with types and generate IDs
      const taggedErc20 = erc20Approvals.map(a => ({
        ...a, 
        type: 'ERC-20', 
        id: `erc20-${a.contract}-${a.spender}`
      }));
      
      const taggedNft = nftApprovals.map(a => ({
        ...a, 
        type: 'ERC-721', 
        id: `erc721-${a.contract}-${a.spender}-${a.tokenId || 'all'}`
      }));
      
      const taggedErc1155 = erc1155Approvals.map(a => ({
        ...a, 
        type: 'ERC-1155', 
        id: `erc1155-${a.contract}-${a.spender}`
      }));
      
      // Update Redux store with all approvals
      const allApprovals = [...taggedErc20, ...taggedNft, ...taggedErc1155];
      dispatch(setApprovals(allApprovals));

      console.log("✅ Approvals refreshed!");
    } catch (error) {
      console.error("❌ Error refreshing approvals:", error);
    } finally {
      setIsRevoking(false);
    }
  };

  // Render approval table for a specific type
  const renderApprovalTable = (approvals, type) => {
    if (approvals.length === 0) {
      return (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No {type} approvals found. Connect your wallet and refresh to see approvals.
        </div>
      );
    }
    
    if (type === 'ERC-20') {
      return (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-light">
              <tr>
                <th style={{width: "60px"}}>Select</th>
                <th>Token</th>
                <th>Spender</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval, index) => (
                <tr key={`erc20-${index}`} className={
                  selectedApprovals.some(a => 
                    a.type === 'ERC-20' &&
                    a.contract === approval.contract && 
                    a.spender === approval.spender
                  ) ? 'table-primary' : ''
                }>
                  <td>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedApprovals.some(a => 
                          a.type === 'ERC-20' &&
                          a.contract === approval.contract && 
                          a.spender === approval.spender
                        )}
                        onChange={() => handleSelectApproval(approval)}
                        id={`erc20-approval-${index}`}
                        disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
                                 !selectedApprovals.some(a => 
                                   a.type === 'ERC-20' &&
                                   a.contract === approval.contract && 
                                   a.spender === approval.spender
                                 ))}
                      />
                      <label className="form-check-label" htmlFor={`erc20-approval-${index}`}></label>
                    </div>
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    <span className="badge bg-success me-1">ERC-20</span>
                    {approval.tokenSymbol || approval.contract.substring(0, 8) + '...'}
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    <code>{approval.spenderName || approval.spender.substring(0, 8) + '...'}</code>
                  </td>
                  <td>Unlimited</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (type === 'ERC-721') {
      return (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-light">
              <tr>
                <th style={{width: "60px"}}>Select</th>
                <th>Contract</th>
                <th>Token ID</th>
                <th>Spender</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval, index) => (
                <tr key={`nft-${index}`} className={
                  selectedApprovals.some(a => 
                    a.type === 'ERC-721' &&
                    a.contract === approval.contract && 
                    a.spender === approval.spender && 
                    a.tokenId === approval.tokenId
                  ) ? 'table-primary' : ''
                }>
                  <td>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedApprovals.some(a => 
                          a.type === 'ERC-721' &&
                          a.contract === approval.contract && 
                          a.spender === approval.spender && 
                          a.tokenId === approval.tokenId
                        )}
                        onChange={() => handleSelectApproval(approval)}
                        id={`nft-approval-${index}`}
                        disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
                                 !selectedApprovals.some(a => 
                                   a.type === 'ERC-721' &&
                                   a.contract === approval.contract && 
                                   a.spender === approval.spender && 
                                   a.tokenId === approval.tokenId
                                 ))}
                      />
                      <label className="form-check-label" htmlFor={`nft-approval-${index}`}></label>
                    </div>
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    <span className="badge bg-primary me-1">ERC-721</span>
                    {approval.contract.substring(0, 8) + '...'}
                  </td>
                  <td>{approval.tokenId === 'all' ? 'All' : `#${approval.tokenId}`}</td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    <code>{approval.spender.substring(0, 8) + '...'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (type === 'ERC-1155') {
      return (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-light">
              <tr>
                <th style={{width: "60px"}}>Select</th>
                <th>Collection</th>
                <th>Spender</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval, index) => (
                <tr key={`erc1155-${index}`} className={
                  selectedApprovals.some(a => 
                    a.type === 'ERC-1155' &&
                    a.contract === approval.contract && 
                    a.spender === approval.spender
                  ) ? 'table-primary' : ''
                }>
                  <td>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedApprovals.some(a => 
                          a.type === 'ERC-1155' &&
                          a.contract === approval.contract && 
                          a.spender === approval.spender
                        )}
                        onChange={() => handleSelectApproval(approval)}
                        id={`erc1155-approval-${index}`}
                        disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
                                 !selectedApprovals.some(a => 
                                   a.type === 'ERC-1155' &&
                                   a.contract === approval.contract && 
                                   a.spender === approval.spender
                                 ))}
                      />
                      <label className="form-check-label" htmlFor={`erc1155-approval-${index}`}></label>
                    </div>
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    <span className="badge bg-warning text-dark me-1">ERC-1155</span>
                    {approval.collectionName || approval.contract.substring(0, 8) + '...'}
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    <code>{approval.spenderName || approval.spender.substring(0, 8) + '...'}</code>
                  </td>
                  <td>All tokens (collection-wide)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (type === 'All') {
      // Combined table for all approval types
      return (
        <div className="table-responsive">
          <table className="table table-hover table-sm">
            <thead className="table-light">
              <tr>
                <th style={{width: "60px"}}>Select</th>
                <th>Type</th>
                <th>Token/Contract</th>
                <th>Details</th>
                <th>Spender</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval, index) => (
                <tr key={`mixed-${index}`} className={
                  selectedApprovals.some(a => 
                    a.type === approval.type &&
                    a.contract === approval.contract && 
                    a.spender === approval.spender &&
                    (approval.type !== 'ERC-721' || a.tokenId === approval.tokenId)
                  ) ? 'table-primary' : ''
                }>
                  <td>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedApprovals.some(a => 
                          a.type === approval.type &&
                          a.contract === approval.contract && 
                          a.spender === approval.spender &&
                          (approval.type !== 'ERC-721' || a.tokenId === approval.tokenId)
                        )}
                        onChange={() => handleSelectApproval(approval)}
                        id={`mixed-approval-${index}`}
                        disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
                                 !selectedApprovals.some(a => 
                                   a.type === approval.type &&
                                   a.contract === approval.contract && 
                                   a.spender === approval.spender &&
                                   (approval.type !== 'ERC-721' || a.tokenId === approval.tokenId)
                                 ))}
                      />
                      <label className="form-check-label" htmlFor={`mixed-approval-${index}`}></label>
                    </div>
                  </td>
                  <td>
                    <span className={`badge bg-${
                      approval.type === 'ERC-20' ? 'success' : 
                      approval.type === 'ERC-721' ? 'primary' : 
                      'warning text-dark'
                    } me-1`}>
                      {approval.type}
                    </span>
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    {approval.tokenSymbol || approval.collectionName || approval.contract.substring(0, 8) + '...'}
                  </td>
                  <td>
                    {approval.type === 'ERC-20' && <span>Unlimited Amount</span>}
                    {approval.type === 'ERC-721' && (
                      <span>{approval.tokenId === 'all' ? 'All tokens' : `Token #${approval.tokenId}`}</span>
                    )}
                    {approval.type === 'ERC-1155' && <span>All tokens</span>}
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '100px' }}>
                    <code>{approval.spenderName || approval.spender.substring(0, 8) + '...'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="card shadow-sm mb-4">
      {/* Card Header */}
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <span className="me-2">🔥</span>
          Batch Revoke Approvals
          <span className="badge bg-info ms-2 text-dark">BETA</span>
        </h5>
        <div>
          <button 
            className="btn btn-outline-primary" 
            onClick={refreshBatchRevoke}
            disabled={isRevoking || !wallet}
          >
            {isRevoking ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* Batch size warning */}
        {isBatchSizeExceeded && (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            For safety, you can only revoke up to {maxBatchSize} approvals at once.
            Please deselect {selectedApprovals.length - maxBatchSize} approval(s).
          </div>
        )}
        
        {/* Progress bar for batch operations */}
        {progress.processing && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span>{progress.status}</span>
              <span>{progress.current}/{progress.total} completed</span>
            </div>
            <div className="progress">
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{width: `${(progress.current / progress.total) * 100}%`}}
                aria-valuenow={progress.current} 
                aria-valuemin="0" 
                aria-valuemax={progress.total}
              ></div>
            </div>
          </div>
        )}
        
        {/* Tab navigation for different token types */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Approvals <span className="badge bg-secondary ms-1">{allApprovals.length}</span>
              {selectedApprovals.length > 0 && (
                <span className="badge bg-primary ms-1">{selectedApprovals.length} selected</span>
              )}
            </button>
          </li>
          
          {FEATURES.batchRevoke.erc20Enabled && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'erc20' ? 'active' : ''}`}
                onClick={() => setActiveTab('erc20')}
              >
                ERC-20 <span className="badge bg-success ms-1">{erc20Approvals.length}</span>
                {selectedERC20Count > 0 && (
                  <span className="badge bg-primary ms-1">{selectedERC20Count} selected</span>
                )}
              </button>
            </li>
          )}
          
          {FEATURES.batchRevoke.nftEnabled && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'nft' ? 'active' : ''}`}
                onClick={() => setActiveTab('nft')}
              >
                ERC-721 <span className="badge bg-primary ms-1">{nftApprovals.length}</span>
                {selectedNFTCount > 0 && (
                  <span className="badge bg-primary ms-1">{selectedNFTCount} selected</span>
                )}
              </button>
            </li>
          )}
          
          {FEATURES.batchRevoke.erc1155Enabled && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'erc1155' ? 'active' : ''}`}
                onClick={() => setActiveTab('erc1155')}
              >
                ERC-1155 <span className="badge bg-warning text-dark ms-1">{erc1155Approvals.length}</span>
                {selectedERC1155Count > 0 && (
                  <span className="badge bg-primary ms-1">{selectedERC1155Count} selected</span>
                )}
              </button>
            </li>
          )}
        </ul>
        
        {/* Approval Tables */}
        <div className={activeTab === 'all' ? '' : 'd-none'}>
          {renderApprovalTable(allApprovals, 'All')}
        </div>
        
        <div className={activeTab === 'erc20' ? '' : 'd-none'}>
          {renderApprovalTable(erc20Approvals, 'ERC-20')}
        </div>
        
        <div className={activeTab === 'nft' ? '' : 'd-none'}>
          {renderApprovalTable(nftApprovals, 'ERC-721')}
        </div>
        
        <div className={activeTab === 'erc1155' ? '' : 'd-none'}>
          {renderApprovalTable(erc1155Approvals, 'ERC-1155')}
        </div>

        {/* Gas estimate display */}
        {gasEstimate && gasEstimate.status === 'success' && (
          <div className="alert alert-info mt-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Estimated Gas Cost:</strong> ~{gasEstimate.costEth} ETH (~${gasEstimate.costUsd})
                <br />
                <small className="text-muted">At {gasEstimate.gasPriceGwei} Gwei gas price</small>
              </div>
              <div>
                <small className="text-muted">This is an estimate and actual costs may vary</small>
              </div>
            </div>
            {gasEstimate.errors && gasEstimate.errors.length > 0 && (
              <div className="mt-2">
                <small className="text-danger">
                  Some gas estimates could not be calculated:
                  <ul className="mb-0 mt-1">
                    {gasEstimate.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </small>
              </div>
            )}
          </div>
        )}

        {/* Results message */}
        {results && (
          <div className={`alert ${results.success ? 'alert-success' : 'alert-danger'} mt-3 d-flex justify-content-between align-items-center`}>
            <div>
              {results.success ? (
                <div>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Successfully revoked {results.successful} approval(s)
                  {results.failed > 0 && (
                    <div className="mt-1">❌ Failed to revoke {results.failed} approval(s)</div>
                  )}
                </div>
              ) : (
                <div>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Error: {results.message}
                </div>
              )}
            </div>
            <button className="btn-close" onClick={() => setResults(null)}></button>
          </div>
        )}

        {/* Action buttons */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <small className="text-muted">
              Select up to {maxBatchSize} approvals to revoke in a single operation.
              {selectedApprovals.length > 0 && (
                <span>
                  {' '}Selected: {
                    [
                      selectedERC20Count > 0 ? `${selectedERC20Count} ERC-20` : '',
                      selectedNFTCount > 0 ? `${selectedNFTCount} ERC-721` : '',
                      selectedERC1155Count > 0 ? `${selectedERC1155Count} ERC-1155` : ''
                    ].filter(Boolean).join(', ')
                  }
                </span>
              )}
            </small>
          </div>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setSelectedApprovals([])}
              disabled={!isAnySelected || isRevoking}
            >
              Clear Selection
            </button>
            <button
              className="btn btn-danger"
              onClick={handleRevocationRequest}
              disabled={!isAnySelected || isRevoking || isBatchSizeExceeded}
            >
              {isRevoking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Revoking...
                </>
              ) : (
                <>🔥 Revoke Selected ({selectedApprovals.length})</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Batch Revocation</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmation(false)}></button>
              </div>
              <div className="modal-body">
                <p>You are about to revoke {selectedApprovals.length} approval(s):</p>
                <ul>
                  {selectedERC20Count > 0 && (
                    <li>{selectedERC20Count} ERC-20 token approval(s)</li>
                  )}
                  {selectedNFTCount > 0 && (
                    <li>{selectedNFTCount} ERC-721 NFT approval(s)</li>
                  )}
                  {selectedERC1155Count > 0 && (
                    <li>{selectedERC1155Count} ERC-1155 collection approval(s)</li>
                  )}
                </ul>
                
                {gasEstimate && gasEstimate.status === 'success' && (
                  <div className="alert alert-info">
                    <strong>Estimated Gas Cost:</strong> ~{gasEstimate.costEth} ETH (~${gasEstimate.costUsd})
                  </div>
                )}
                
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  This will submit multiple blockchain transactions that cannot be reversed.
                </div>
                
                <p>Are you sure you want to proceed?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={executeBatchRevoke}>
                  Yes, Revoke These Approvals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRevoke;








// // BatchRevoke.js
// import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { batchRevokeERC20Approvals, batchRevokeNFTApprovals } from '../utils/batchRevokeUtils';
// import { getProvider } from '../utils/provider';
// import { setApprovals } from "../store/web3Slice";
// import { FEATURES } from '../constants/config';
// import { getERC20Approvals } from '../utils/erc20Approvals';  // Add this
// import { getERC721Approvals } from '../utils/nftApprovals';   // Add this


// const BatchRevoke = () => {
//   // Don't render anything if feature is disabled
//   if (!FEATURES.batchRevoke.enabled) {
//     return null;
//   }

//   const dispatch = useDispatch();
//   const approvals = useSelector((state) => state.web3.approvals);

// // 🔥 Debugging Hook: Log approvals whenever they change
// useEffect(() => {
//   console.log("🔄 Approvals updated, triggering re-render:", approvals);
// }, [approvals]);  

//   const [selectedApprovals, setSelectedApprovals] = useState([]);
//   const [isRevoking, setIsRevoking] = useState(false);
//   const [results, setResults] = useState(null);
//   // New state variables for safety features
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [gasEstimate, setGasEstimate] = useState(null);
//   const [activeTab, setActiveTab] = useState('erc20');

//   // Maximum batch size from feature settings
//   const maxBatchSize = FEATURES.batchRevoke.maxBatchSize || 5;
//   const isBatchSizeExceeded = selectedApprovals.length > maxBatchSize;
  
//   // Filter approvals based on enabled features
//   const erc20Approvals = FEATURES.batchRevoke.erc20Enabled 
//     ? approvals.filter(a => a.type === 'ERC-20')
//     : [];
  
//   const nftApprovals = FEATURES.batchRevoke.nftEnabled 
//     ? approvals.filter(a => a.type === 'ERC-721')
//     : [];

// // Replace the current handleSelectApproval function with this one:
// const handleSelectApproval = (approval) => {
//   console.log("🔍 Toggling selection for:", approval);
  
//   setSelectedApprovals((prev) => {
//     // Different selection logic based on approval type
//     let isSelected;
    
//     if (approval.type === 'ERC-20') {
//       // For ERC-20, check contract and spender only
//       isSelected = prev.some((a) => 
//         a.contract === approval.contract && a.spender === approval.spender
//       );
//     } else if (approval.type === 'ERC-721') {
//       // For NFTs, also check tokenId to handle individual token approvals
//       isSelected = prev.some((a) => 
//         a.contract === approval.contract && 
//         a.spender === approval.spender && 
//         a.tokenId === approval.tokenId
//       );
//     } else {
//       // For other types
//       isSelected = prev.some((a) => 
//         a.contract === approval.contract && a.spender === approval.spender
//       );
//     }
    
//     if (isSelected) {
//       // Remove if already selected - with proper type handling
//       if (approval.type === 'ERC-721') {
//         return prev.filter((a) => 
//           !(a.contract === approval.contract && 
//             a.spender === approval.spender && 
//             a.tokenId === approval.tokenId)
//         );
//       } else {
//         return prev.filter((a) => 
//           !(a.contract === approval.contract && a.spender === approval.spender)
//         );
//       }
//     } else {
//       // Add if not selected
//       return [...prev, approval];
//     }
//   });
// };

//   // Estimate gas for better UX and safety
//   const estimateGas = async () => {
//     if (selectedApprovals.length === 0) return;
    
//     try {
//       setGasEstimate({ status: 'loading' });
      
//       const provider = await getProvider();
//       const signer = await provider.getSigner();
      
//       // Split approvals by type
//       const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
//       const nftApprovals = selectedApprovals.filter(a => a.type === 'ERC-721');
      
//       let totalGasEstimate = 0n;
//       let estimationErrors = [];
      
//       // Calculate ERC-20 gas estimates
//       if (erc20Approvals.length > 0) {
//         for (const approval of erc20Approvals) {
//           try {
//             const contract = new Contract(approval.contract, ["function approve(address,uint256)"], signer);
//             const gasEstimate = await contract.approve.estimateGas(approval.spender, 0);
//             totalGasEstimate += gasEstimate;
//           } catch (error) {
//             estimationErrors.push(`ERC-20 (${approval.contract.substring(0, 8)}...): ${error.message}`);
//           }
//         }
//       }
      
//       // Calculate NFT gas estimates if applicable
//       if (nftApprovals.length > 0 && FEATURES.batchRevoke.nftEnabled) {
//         // Group by contract address
//         const approvalsByContract = {};
        
//         for (const approval of nftApprovals) {
//           if (!approvalsByContract[approval.contract]) {
//             approvalsByContract[approval.contract] = [];
//           }
//           approvalsByContract[approval.contract].push({
//             ...approval,
//             tokenId: parseInt(approval.tokenId, 10)
//           });
//         }
        
//         for (const contractAddress of Object.keys(approvalsByContract)) {
//           try {
//             const tokenIds = approvalsByContract[contractAddress].map(a => a.tokenId);
//             const contract = new Contract(
//               contractAddress,
//               ["function batchRevokeApprovals(uint256[]) external"],
//               signer
//             );
//             const gasEstimate = await contract.batchRevokeApprovals.estimateGas(tokenIds);
//             totalGasEstimate += gasEstimate;
//           } catch (error) {
//             estimationErrors.push(`NFT (${contractAddress.substring(0, 8)}...): ${error.message}`);
//           }
//         }
//       }
      
//       // Get current gas price
//       const gasPrice = await provider.getGasPrice();
//       const gasPriceInGwei = Number(gasPrice) / 1e9;
//       const estimatedCostWei = totalGasEstimate * gasPrice;
//       const estimatedCostEth = Number(estimatedCostWei) / 1e18;
      
//       setGasEstimate({
//         status: 'success',
//         totalGas: totalGasEstimate.toString(),
//         gasPriceGwei: gasPriceInGwei.toFixed(2),
//         costEth: estimatedCostEth.toFixed(6),
//         costUsd: (estimatedCostEth * 3000).toFixed(2), // Rough USD estimate
//         errors: estimationErrors
//       });
      
//     } catch (error) {
//       console.error("Error estimating gas:", error);
//       setGasEstimate({
//         status: 'error',
//         message: error.message
//       });
//     }
//   };

//   // Handle revocation request - with confirmation step
//   const handleRevocationRequest = async () => {
//     if (selectedApprovals.length === 0) {
//       console.log("⚠️ No approvals selected");
//       return;
//     }
    
//     if (isBatchSizeExceeded) {
//       setResults({
//         success: false,
//         message: `Safety limit: Maximum ${maxBatchSize} approvals can be revoked at once`
//       });
//       return;
//     }
    
//     // If gas estimation is enabled, do that first
//     if (FEATURES.batchRevoke.showGasEstimates) {
//       await estimateGas();
//     }
    
//     // If confirmation is required, show dialog
//     if (FEATURES.batchRevoke.requireConfirmation) {
//       setShowConfirmation(true);
//     } else {
//       // Otherwise proceed directly
//       executeBatchRevoke();
//     }
//   };

//   // Actual revocation execution
//   const executeBatchRevoke = async () => {
//     setShowConfirmation(false);
//     setIsRevoking(true);
//     setResults(null);
    
//     try {
//       const provider = await getProvider();
//       const signer = await provider.getSigner();
//       console.log("🔄 Starting batch revocation with signer:", await signer.getAddress());
      
//       // Split approvals by type
//       const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
//       const nftApprovals = selectedApprovals.filter(a => a.type === 'ERC-721' && a.tokenId !== 'all');
      
//       let erc20Results = { successful: [], failed: [] };
//       let nftResults = { successful: [], failed: [] };
      
//       // Process ERC-20 approvals
//       if (erc20Approvals.length > 0) {
//         console.log("🚀 Revoking ERC-20 approvals:", erc20Approvals);
//         erc20Results = await batchRevokeERC20Approvals(erc20Approvals, signer);
//       }
      
//       // Process NFT approvals
//       if (nftApprovals.length > 0 && FEATURES.batchRevoke.nftEnabled) {
//         console.log("🚀 Revoking NFT approvals:", nftApprovals);
//         nftResults = await batchRevokeNFTApprovals(nftApprovals, signer);
//       }
      
//       // Combine results
//       const combinedResults = {
//         success: true,
//         failed: erc20Results.failed.length + nftResults.failed.length,
//         successful: erc20Results.successful.length + nftResults.successful.length,
//         details: {
//           erc20: erc20Results,
//           nft: nftResults
//         }
//       };
      
//       setResults(combinedResults);
      
//       // Update the Redux store to remove successfully revoked approvals
//       setTimeout(() => {
//         // Filter out revoked approvals
//         const updatedApprovals = approvals.filter(approval => {
//           // For ERC-20, check if it was successfully revoked
//           if (approval.type === 'ERC-20') {
//             return !erc20Results.successful.some(
//               result => result.tokenAddress === approval.contract && 
//                         result.spender === approval.spender
//             );
//           }
          
//           // For NFT, check if it was successfully revoked
//           if (approval.type === 'ERC-721' && approval.tokenId !== 'all') {
//             return !nftResults.successful.some(
//               result => result.contract === approval.contract && 
//                         String(result.tokenId) === approval.tokenId
//             );
//           }
        

//           // Keep other approvals
//           return true;
//         });
        
//         // Update Redux
//         dispatch(setApprovals(updatedApprovals));
//       }, 2000);
      
//       // Clear selections on success
//       setSelectedApprovals([]);
      
//     } catch (error) {
//       console.error("❌ Batch revocation error:", error);
//       setResults({
//         success: false,
//         message: error.message || "Failed to revoke approvals"
//       });
//     } finally {
//       setIsRevoking(false);
//     }
//   };

//   // Calculate counts
//   const isAnySelected = selectedApprovals.length > 0;
//   const selectedERC20Count = selectedApprovals.filter(a => a.type === 'ERC-20').length;
//   const selectedNFTCount = selectedApprovals.filter(a => a.type === 'ERC-721').length;
  
// const refreshBatchRevoke = async (existingApprovals) => {
//   if (isRevoking) return;
  
//   setIsRevoking(true);

//   try {
//     const provider = await getProvider();
//     const signer = await provider.getSigner();
//     const address = await signer.getAddress();

//     console.log("🔄 Refreshing approvals for:", address);

//     // Fetch ERC-20 and ERC-721 approvals
// console.log("📢 Calling getERC20Approvals...");
// const erc20Approvals = FEATURES.batchRevoke.erc20Enabled 
//   ? await getERC20Approvals([], address) || []
//   : [];
// console.log("📜 Fetched ERC-20 Approvals:", erc20Approvals);

// console.log("📢 Calling getERC721Approvals...");
// const nftApprovals = FEATURES.batchRevoke.nftEnabled 
//   ? await getERC721Approvals(userAddress) || []
//   : [];
// console.log("🎨 Fetched ERC-721 Approvals:", nftApprovals);


//     // 🔥 Log fetched data to verify
//     console.log("📜 Fetched ERC-20 Approvals:", erc20Approvals);
//     console.log("🎨 Fetched ERC-721 Approvals:", nftApprovals);
// console.log("🔍 FEATURE FLAGS:");
// console.log("  ➤ Batch Revoke Enabled:", FEATURES.batchRevoke.enabled);
// console.log("  ➤ ERC-20 Batch Enabled:", FEATURES.batchRevoke.erc20Enabled);
// console.log("  ➤ ERC-721 Batch Enabled:", FEATURES.batchRevoke.nftEnabled);

//     if (erc20Approvals.length === 0) {
//       console.warn("⚠️ No ERC-20 approvals found. Is getERC20Approvals working?");
//     }

//     if (nftApprovals.length === 0) {
//       console.warn("⚠️ No ERC-721 approvals found. Is getERC721Approvals working?");
//     }

//     // Preserve existing approvals & prevent duplicates
//     const preservedApprovals = existingApprovals.filter((approval) => 
//       !erc20Approvals.some(e => e.contract === approval.contract && e.spender === approval.spender) &&
//       !nftApprovals.some(n => n.contract === approval.contract && n.spender === approval.spender && n.tokenId === approval.tokenId)
//     );

//     const updatedApprovals = [...preservedApprovals, ...erc20Approvals, ...nftApprovals];

//     console.log("✅ Merging new approvals with existing:", updatedApprovals);

//     dispatch(setApprovals(updatedApprovals));

//     console.log("✅ Approvals refreshed!");
//   } catch (error) {
//     console.error("❌ Error refreshing approvals:", error);
//   } finally {
//     setIsRevoking(false);
//   }
// };








//   return (
//     <div className="card shadow-sm mb-4">
// <div className="card-header bg-light d-flex justify-content-between align-items-center">
//   <h5 className="mb-0">
//     <span className="me-2">🔥</span>
//     Batch Revoke Approvals
//     {FEATURES.batchRevoke.nftEnabled && 
//       <span className="badge bg-info ms-2 text-dark">BETA</span>
//     }
//   </h5>
//   <div>
// <button 
//   className="btn btn-outline-primary me-2" 
//   onClick={() => refreshBatchRevoke(approvals)} // ✅ Pass existing approvals
//   disabled={isRevoking}
// >
//   {isRevoking ? 'Refreshing...' : 'Refresh'}
// </button>
//   </div>
// </div>

      
//       <div className="card-body">
//         {/* Safety warning for batch size */}
//         {isBatchSizeExceeded && (
//           <div className="alert alert-warning">
//             <i className="bi bi-exclamation-triangle-fill me-2"></i>
//             For safety, you can only revoke up to {maxBatchSize} approvals at once.
//             Please deselect {selectedApprovals.length - maxBatchSize} approval(s).
//           </div>
//         )}
        
//         {/* Tab navigation when NFT revocation is enabled */}
//         {FEATURES.batchRevoke.nftEnabled && (
//           <ul className="nav nav-tabs mb-3">
//             <li className="nav-item">
//               <button 
//                 className={`nav-link ${activeTab === 'erc20' ? 'active' : ''}`}
//                 onClick={() => setActiveTab('erc20')}
//               >
//                 ERC-20 Tokens <span className="badge bg-success ms-1">{erc20Approvals.length}</span>
//                 {selectedERC20Count > 0 && <span className="badge bg-primary ms-1">{selectedERC20Count} selected</span>}
//               </button>
//             </li>
//             <li className="nav-item">
//               <button 
//                 className={`nav-link ${activeTab === 'nft' ? 'active' : ''}`}
//                 onClick={() => setActiveTab('nft')}
//               >
//                 NFTs <span className="badge bg-primary ms-1">{nftApprovals.length}</span>
//                 {selectedNFTCount > 0 && <span className="badge bg-primary ms-1">{selectedNFTCount} selected</span>}
//               </button>
//             </li>
//           </ul>
//         )}
        
//         {/* ERC-20 Approvals */}
//         <div className={activeTab === 'erc20' || !FEATURES.batchRevoke.nftEnabled ? '' : 'd-none'}>
//           {erc20Approvals.length === 0 ? (
//             <div className="alert alert-info">
//               <i className="bi bi-info-circle me-2"></i>
//               No ERC-20 approvals found. Connect your wallet and refresh to see approvals.
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <table className="table table-hover table-sm">
//                 <thead className="table-light">
//                   <tr>
//                     <th style={{width: "60px"}}>Select</th>
//                     <th>Token</th>
//                     <th>Spender</th>
//                     <th>Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {erc20Approvals.map((approval, index) => (
//                     <tr key={`erc20-${index}`} className={
//                       selectedApprovals.some(a => a.contract === approval.contract && a.spender === approval.spender) 
//                         ? 'table-primary' 
//                         : ''
//                     }>
//                       <td>
//                         <div className="form-check">
//                           <input
//                             type="checkbox"
//                             className="form-check-input"
//                             checked={selectedApprovals.some(
//                               (a) =>
//                                 a.contract === approval.contract && a.spender === approval.spender
//                             )}
//                             onChange={() => handleSelectApproval(approval)}
//                             id={`erc20-approval-${index}`}
//                             disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
//                                      !selectedApprovals.some(a => 
//                                        a.contract === approval.contract && a.spender === approval.spender
//                                      ))}
//                           />
//                           <label className="form-check-label" htmlFor={`erc20-approval-${index}`}></label>
//                         </div>
//                       </td>
//                       <td className="text-truncate" style={{ maxWidth: '150px' }}>
//                         <span className="badge bg-success me-1">ERC-20</span>
//                         {approval.tokenSymbol || approval.contract.substring(0, 8) + '...'}
//                       </td>
//                       <td className="text-truncate" style={{ maxWidth: '150px' }}>
//                         <code>{approval.spenderName || approval.spender.substring(0, 8) + '...'}</code>
//                       </td>
//                       <td>Unlimited</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
        
//         {/* NFT Approvals - only shown if feature is enabled */}
//         {FEATURES.batchRevoke.nftEnabled && (
//           <div className={activeTab === 'nft' ? '' : 'd-none'}>
//             {nftApprovals.length === 0 ? (
//               <div className="alert alert-info">
//                 <i className="bi bi-info-circle me-2"></i>
//                 No NFT approvals found. Connect your wallet and refresh to see approvals.
//               </div>
//             ) : (
//               <div className="table-responsive">
//                 <table className="table table-hover table-sm">
//                   <thead className="table-light">
//                     <tr>
//                       <th style={{width: "60px"}}>Select</th>
//                       <th>Contract</th>
//                       <th>Token ID</th>
//                       <th>Spender</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {nftApprovals.map((approval, index) => (
//                       <tr key={`nft-${index}`} className={
//                         selectedApprovals.some(a => 
//                           a.contract === approval.contract && 
//                           a.spender === approval.spender && 
//                           a.tokenId === approval.tokenId
//                         ) ? 'table-primary' : ''
//                       }>
//                         <td>
//                           <div className="form-check">
//                             <input
//                               type="checkbox"
//                               className="form-check-input"
//                               checked={selectedApprovals.some(a => 
//                                 a.contract === approval.contract && 
//                                 a.spender === approval.spender && 
//                                 a.tokenId === approval.tokenId
//                               )}
//                               onChange={() => handleSelectApproval(approval)}
//                               id={`nft-approval-${index}`}
//                               disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
//                                        !selectedApprovals.some(a => 
//                                          a.contract === approval.contract && 
//                                          a.spender === approval.spender && 
//                                          a.tokenId === approval.tokenId
//                                        ))}
//                             />
//                             <label className="form-check-label" htmlFor={`nft-approval-${index}`}></label>
//                           </div>
//                         </td>
//                         <td className="text-truncate" style={{ maxWidth: '150px' }}>
//                           <span className="badge bg-primary me-1">ERC-721</span>
//                           {approval.contract.substring(0, 8) + '...'}
//                         </td>
//                         <td>#{approval.tokenId}</td>
//                         <td className="text-truncate" style={{ maxWidth: '150px' }}>
//                           <code>{approval.spender.substring(0, 8) + '...'}</code>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Gas estimate display */}
//         {gasEstimate && gasEstimate.status === 'success' && (
//           <div className="alert alert-info mt-3">
//             <div className="d-flex justify-content-between align-items-center">
//               <div>
//                 <strong>Estimated Gas Cost:</strong> ~{gasEstimate.costEth} ETH (~${gasEstimate.costUsd})
//                 <br />
//                 <small className="text-muted">At {gasEstimate.gasPriceGwei} Gwei gas price</small>
//               </div>
//               <div>
//                 <small className="text-muted">This is an estimate and actual costs may vary</small>
//               </div>
//             </div>
//             {gasEstimate.errors && gasEstimate.errors.length > 0 && (
//               <div className="mt-2">
//                 <small className="text-danger">
//                   Some gas estimates could not be calculated:
//                   <ul className="mb-0 mt-1">
//                     {gasEstimate.errors.map((error, i) => (
//                       <li key={i}>{error}</li>
//                     ))}
//                   </ul>
//                 </small>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Results message */}
//         {results && (
//           <div className={`alert ${results.success ? 'alert-success' : 'alert-danger'} mt-3 d-flex justify-content-between align-items-center`}>
//             <div>
//               {results.success ? (
//                 <div>
//                   <i className="bi bi-check-circle-fill me-2"></i>
//                   Successfully revoked {results.successful} approval(s)
//                   {results.failed > 0 && (
//                     <div className="mt-1">❌ Failed to revoke {results.failed} approval(s)</div>
//                   )}
//                 </div>
//               ) : (
//                 <div>
//                   <i className="bi bi-exclamation-triangle-fill me-2"></i>
//                   Error: {results.message}
//                 </div>
//               )}
//             </div>
//             <button className="btn-close" onClick={() => setResults(null)}></button>
//           </div>
//         )}

//         {/* Action buttons */}
//         <div className="d-flex justify-content-between align-items-center mt-3">
//           <div>
//             <small className="text-muted">
//               Select up to {maxBatchSize} approvals to revoke in a single operation.
//               {selectedApprovals.length > 0 && 
//                 ` Selected: ${selectedERC20Count} ERC-20${selectedNFTCount > 0 ? `, ${selectedNFTCount} NFT` : ''}`
//               }
//             </small>
//           </div>
//           <div className="btn-group">
//             <button
//               className="btn btn-outline-secondary"
//               onClick={() => setSelectedApprovals([])}
//               disabled={!isAnySelected || isRevoking}
//             >
//               Clear Selection
//             </button>
//             <button
//               className="btn btn-danger"
//               onClick={handleRevocationRequest}
//               disabled={!isAnySelected || isRevoking || isBatchSizeExceeded}
//             >
//               {isRevoking ? (
//                 <>
//                   <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                   Revoking...
//                 </>
//               ) : (
//                 <>🔥 Revoke Selected ({selectedApprovals.length})</>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Confirmation Modal */}
//       {showConfirmation && (
//         <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
//           <div className="modal-dialog">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">Confirm Batch Revocation</h5>
//                 <button type="button" className="btn-close" onClick={() => setShowConfirmation(false)}></button>
//               </div>
//               <div className="modal-body">
//                 <p>You are about to revoke {selectedApprovals.length} approval(s):</p>
//                 <ul>
//                   {selectedERC20Count > 0 && (
//                     <li>{selectedERC20Count} ERC-20 token approval(s)</li>
//                   )}
//                   {selectedNFTCount > 0 && (
//                     <li>{selectedNFTCount} NFT approval(s)</li>
//                   )}
//                 </ul>
                
//                 {gasEstimate && gasEstimate.status === 'success' && (
//                   <div className="alert alert-info">
//                     <strong>Estimated Gas Cost:</strong> ~{gasEstimate.costEth} ETH (~${gasEstimate.costUsd})
//                   </div>
//                 )}
                
//                 <div className="alert alert-warning">
//                   <i className="bi bi-exclamation-triangle-fill me-2"></i>
//                   This will submit multiple blockchain transactions that cannot be reversed.
//                 </div>
                
//                 <p>Are you sure you want to proceed?</p>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>Cancel</button>
//                 <button type="button" className="btn btn-danger" onClick={executeBatchRevoke}>
//                   Yes, Revoke These Approvals
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BatchRevoke;

