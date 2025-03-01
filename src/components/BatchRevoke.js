// BatchRevoke.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { batchRevokeERC20Approvals, batchRevokeNFTApprovals } from '../utils/batchRevokeUtils';
import { getProvider } from '../utils/provider';
import { setApprovals } from "../store/web3Slice";
import { FEATURES } from '../constants/config';
import { getERC20Approvals } from '../utils/erc20Approvals';  // Add this
import { getERC721Approvals } from '../utils/nftApprovals';   // Add this


const BatchRevoke = () => {
  // Don't render anything if feature is disabled
  if (!FEATURES.batchRevoke.enabled) {
    return null;
  }

  const dispatch = useDispatch();
  const approvals = useSelector((state) => state.web3.approvals);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isRevoking, setIsRevoking] = useState(false);
  const [results, setResults] = useState(null);
  // New state variables for safety features
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [activeTab, setActiveTab] = useState('erc20');

  // Maximum batch size from feature settings
  const maxBatchSize = FEATURES.batchRevoke.maxBatchSize || 5;
  const isBatchSizeExceeded = selectedApprovals.length > maxBatchSize;
  
  // Filter approvals based on enabled features
  const erc20Approvals = FEATURES.batchRevoke.erc20Enabled 
    ? approvals.filter(a => a.type === 'ERC-20')
    : [];
  
  const nftApprovals = FEATURES.batchRevoke.nftEnabled 
    ? approvals.filter(a => a.type === 'ERC-721' && a.tokenId !== 'all')
    : [];

// Replace the current handleSelectApproval function with this one:
const handleSelectApproval = (approval) => {
  console.log("🔍 Toggling selection for:", approval);
  
  setSelectedApprovals((prev) => {
    // Different selection logic based on approval type
    let isSelected;
    
    if (approval.type === 'ERC-20') {
      // For ERC-20, check contract and spender only
      isSelected = prev.some((a) => 
        a.contract === approval.contract && a.spender === approval.spender
      );
    } else if (approval.type === 'ERC-721') {
      // For NFTs, also check tokenId to handle individual token approvals
      isSelected = prev.some((a) => 
        a.contract === approval.contract && 
        a.spender === approval.spender && 
        a.tokenId === approval.tokenId
      );
    } else {
      // For other types
      isSelected = prev.some((a) => 
        a.contract === approval.contract && a.spender === approval.spender
      );
    }
    
    if (isSelected) {
      // Remove if already selected - with proper type handling
      if (approval.type === 'ERC-721') {
        return prev.filter((a) => 
          !(a.contract === approval.contract && 
            a.spender === approval.spender && 
            a.tokenId === approval.tokenId)
        );
      } else {
        return prev.filter((a) => 
          !(a.contract === approval.contract && a.spender === approval.spender)
        );
      }
    } else {
      // Add if not selected
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
      
      let totalGasEstimate = 0n;
      let estimationErrors = [];
      
      // Calculate ERC-20 gas estimates
      if (erc20Approvals.length > 0) {
        for (const approval of erc20Approvals) {
          try {
            const contract = new Contract(approval.contract, ["function approve(address,uint256)"], signer);
            const gasEstimate = await contract.approve.estimateGas(approval.spender, 0);
            totalGasEstimate += gasEstimate;
          } catch (error) {
            estimationErrors.push(`ERC-20 (${approval.contract.substring(0, 8)}...): ${error.message}`);
          }
        }
      }
      
      // Calculate NFT gas estimates if applicable
      if (nftApprovals.length > 0 && FEATURES.batchRevoke.nftEnabled) {
        // Group by contract address
        const approvalsByContract = {};
        
        for (const approval of nftApprovals) {
          if (!approvalsByContract[approval.contract]) {
            approvalsByContract[approval.contract] = [];
          }
          approvalsByContract[approval.contract].push({
            ...approval,
            tokenId: parseInt(approval.tokenId, 10)
          });
        }
        
        for (const contractAddress of Object.keys(approvalsByContract)) {
          try {
            const tokenIds = approvalsByContract[contractAddress].map(a => a.tokenId);
            const contract = new Contract(
              contractAddress,
              ["function batchRevokeApprovals(uint256[]) external"],
              signer
            );
            const gasEstimate = await contract.batchRevokeApprovals.estimateGas(tokenIds);
            totalGasEstimate += gasEstimate;
          } catch (error) {
            estimationErrors.push(`NFT (${contractAddress.substring(0, 8)}...): ${error.message}`);
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

  // Handle revocation request - with confirmation step
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

  // Actual revocation execution
  const executeBatchRevoke = async () => {
    setShowConfirmation(false);
    setIsRevoking(true);
    setResults(null);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      console.log("🔄 Starting batch revocation with signer:", await signer.getAddress());
      
      // Split approvals by type
      const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
      const nftApprovals = selectedApprovals.filter(a => a.type === 'ERC-721' && a.tokenId !== 'all');
      
      let erc20Results = { successful: [], failed: [] };
      let nftResults = { successful: [], failed: [] };
      
      // Process ERC-20 approvals
      if (erc20Approvals.length > 0) {
        console.log("🚀 Revoking ERC-20 approvals:", erc20Approvals);
        erc20Results = await batchRevokeERC20Approvals(erc20Approvals, signer);
      }
      
      // Process NFT approvals
      if (nftApprovals.length > 0 && FEATURES.batchRevoke.nftEnabled) {
        console.log("🚀 Revoking NFT approvals:", nftApprovals);
        nftResults = await batchRevokeNFTApprovals(nftApprovals, signer);
      }
      
      // Combine results
      const combinedResults = {
        success: true,
        failed: erc20Results.failed.length + nftResults.failed.length,
        successful: erc20Results.successful.length + nftResults.successful.length,
        details: {
          erc20: erc20Results,
          nft: nftResults
        }
      };
      
      setResults(combinedResults);
      
      // Update the Redux store to remove successfully revoked approvals
      setTimeout(() => {
        // Filter out revoked approvals
        const updatedApprovals = approvals.filter(approval => {
          // For ERC-20, check if it was successfully revoked
          if (approval.type === 'ERC-20') {
            return !erc20Results.successful.some(
              result => result.tokenAddress === approval.contract && 
                        result.spender === approval.spender
            );
          }
          
          // For NFT, check if it was successfully revoked
          if (approval.type === 'ERC-721' && approval.tokenId !== 'all') {
            return !nftResults.successful.some(
              result => result.contract === approval.contract && 
                        String(result.tokenId) === approval.tokenId
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
    } finally {
      setIsRevoking(false);
    }
  };

  // Calculate counts
  const isAnySelected = selectedApprovals.length > 0;
  const selectedERC20Count = selectedApprovals.filter(a => a.type === 'ERC-20').length;
  const selectedNFTCount = selectedApprovals.filter(a => a.type === 'ERC-721').length;
  
const refreshBatchRevoke = async () => {
  if (isRevoking) return;
  
  setIsRevoking(true);
  
  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    console.log("🔄 Refreshing approvals for:", address);

    // Fetch ERC-20 and ERC-721 approvals again
    const erc20Approvals = FEATURES.batchRevoke.erc20Enabled 
      ? await getERC20Approvals([], address) || []
      : [];
    
    const nftApprovals = FEATURES.batchRevoke.nftEnabled 
      ? await getERC721Approvals(address) || []
      : [];

    // Update Redux store
    dispatch(setApprovals([...erc20Approvals, ...nftApprovals]));

    console.log("✅ Approvals refreshed!");
  } catch (error) {
    console.error("❌ Error refreshing approvals:", error);
  } finally {
    setIsRevoking(false);
  }
};


  return (
    <div className="card shadow-sm mb-4">
<div className="card-header bg-light d-flex justify-content-between align-items-center">
  <h5 className="mb-0">
    <span className="me-2">🔥</span>
    Batch Revoke Approvals
    {FEATURES.batchRevoke.nftEnabled && 
      <span className="badge bg-info ms-2 text-dark">BETA</span>
    }
  </h5>
  <div>
    <button 
      className="btn btn-outline-primary me-2" 
      onClick={refreshBatchRevoke}
      disabled={isRevoking}
    >
      {isRevoking ? 'Refreshing...' : 'Refresh'}
    </button>
  </div>
</div>

      
      <div className="card-body">
        {/* Safety warning for batch size */}
        {isBatchSizeExceeded && (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            For safety, you can only revoke up to {maxBatchSize} approvals at once.
            Please deselect {selectedApprovals.length - maxBatchSize} approval(s).
          </div>
        )}
        
        {/* Tab navigation when NFT revocation is enabled */}
        {FEATURES.batchRevoke.nftEnabled && (
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'erc20' ? 'active' : ''}`}
                onClick={() => setActiveTab('erc20')}
              >
                ERC-20 Tokens <span className="badge bg-success ms-1">{erc20Approvals.length}</span>
                {selectedERC20Count > 0 && <span className="badge bg-primary ms-1">{selectedERC20Count} selected</span>}
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'nft' ? 'active' : ''}`}
                onClick={() => setActiveTab('nft')}
              >
                NFTs <span className="badge bg-primary ms-1">{nftApprovals.length}</span>
                {selectedNFTCount > 0 && <span className="badge bg-primary ms-1">{selectedNFTCount} selected</span>}
              </button>
            </li>
          </ul>
        )}
        
        {/* ERC-20 Approvals */}
        <div className={activeTab === 'erc20' || !FEATURES.batchRevoke.nftEnabled ? '' : 'd-none'}>
          {erc20Approvals.length === 0 ? (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No ERC-20 approvals found. Connect your wallet and refresh to see approvals.
            </div>
          ) : (
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
                  {erc20Approvals.map((approval, index) => (
                    <tr key={`erc20-${index}`} className={
                      selectedApprovals.some(a => a.contract === approval.contract && a.spender === approval.spender) 
                        ? 'table-primary' 
                        : ''
                    }>
                      <td>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedApprovals.some(
                              (a) =>
                                a.contract === approval.contract && a.spender === approval.spender
                            )}
                            onChange={() => handleSelectApproval(approval)}
                            id={`erc20-approval-${index}`}
                            disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
                                     !selectedApprovals.some(a => 
                                       a.contract === approval.contract && a.spender === approval.spender
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
          )}
        </div>
        
        {/* NFT Approvals - only shown if feature is enabled */}
        {FEATURES.batchRevoke.nftEnabled && (
          <div className={activeTab === 'nft' ? '' : 'd-none'}>
            {nftApprovals.length === 0 ? (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No NFT approvals found. Connect your wallet and refresh to see approvals.
              </div>
            ) : (
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
                    {nftApprovals.map((approval, index) => (
                      <tr key={`nft-${index}`} className={
                        selectedApprovals.some(a => 
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
                                a.contract === approval.contract && 
                                a.spender === approval.spender && 
                                a.tokenId === approval.tokenId
                              )}
                              onChange={() => handleSelectApproval(approval)}
                              id={`nft-approval-${index}`}
                              disabled={isRevoking || (selectedApprovals.length >= maxBatchSize && 
                                       !selectedApprovals.some(a => 
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
                        <td>#{approval.tokenId}</td>
                        <td className="text-truncate" style={{ maxWidth: '150px' }}>
                          <code>{approval.spender.substring(0, 8) + '...'}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
              {selectedApprovals.length > 0 && 
                ` Selected: ${selectedERC20Count} ERC-20${selectedNFTCount > 0 ? `, ${selectedNFTCount} NFT` : ''}`
              }
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
                    <li>{selectedNFTCount} NFT approval(s)</li>
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

