import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { Contract, ZeroAddress } from 'ethers';
import { NFT_ABI, CONTRACT_ADDRESSES } from "../constants/abis"; 

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(null); // Track which approval is being processed
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  
  useEffect(() => {
    if (wallet) {
      fetchApprovals();
    }
  }, [wallet]);
  
  // Handle checkbox selection
  const handleToggleSelect = (approval) => {
    setSelectedApprovals(prev => {
      // Check if this approval is already selected
      const isAlreadySelected = prev.some(a => a.id === approval.id);
      
      if (isAlreadySelected) {
        // If selected, remove it
        return prev.filter(a => a.id !== approval.id);
      } else {
        // If not selected, add it
        return [...prev, approval];
      }
    });
  };

  const fetchApprovals = async () => {
    setIsLoading(true);
    setStatusMessage('Fetching approvals...');
    console.log("🔄 Starting approval fetch process...");

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("🔍 Wallet Address:", userAddress);

      const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2];

      const erc20Approvals = await getERC20Approvals(tokenContracts, userAddress) || [];
      const erc721Approvals = await getERC721Approvals(userAddress) || [];
      const erc1155Approvals = await getERC1155Approvals(userAddress) || [];

      const newApprovals = [
        ...erc20Approvals.map(a => ({ ...a, type: 'ERC-20' })),
        ...erc721Approvals.map(a => ({ ...a, type: 'ERC-721' })),
        ...erc1155Approvals.map(a => ({ ...a, type: 'ERC-1155' })),
      ];

      console.log("🟢 Final approvals before dispatch:", newApprovals);
      dispatch(setApprovals(newApprovals));
      setStatusMessage('');
    } catch (error) {
      console.error("❌ Error fetching approvals:", error);
      dispatch(setApprovals([]));
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke a specific ERC-721 token approval
  const handleRevokeERC721 = async (approval) => {
    if (processing) return; // Prevent multiple concurrent revocation operations
    
    setProcessing(approval.id);
    setStatusMessage(`Revoking approval for token ID ${approval.tokenId}...`);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      // Create contract instance with signer
      const nftContract = new Contract(approval.contract, NFT_ABI, signer);
      
      // Proper revocation: Set approval to the zero address
      console.log(`🔄 Revoking approval for token ID ${approval.tokenId}`);
      const tx = await nftContract.approve(ZeroAddress, approval.tokenId);
      
      setStatusMessage(`Transaction submitted. Waiting for confirmation...`);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      await tx.wait();
      console.log(`✅ Transaction confirmed!`);
      setStatusMessage(`Successfully revoked approval for token ID ${approval.tokenId}!`);
      
      // Refresh approvals after successful revocation
      setTimeout(() => {
        fetchApprovals();
        setStatusMessage('');
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error revoking approval:", error);
      setStatusMessage(`Error: ${error.message || "Transaction failed"}`);
    } finally {
      setProcessing(null);
    }
  };

  // For revoking an ERC-721 approval for all tokens
  const handleRevokeERC721All = async (approval) => {
    if (processing) return;
    
    setProcessing(approval.id);
    setStatusMessage(`Revoking approval for all tokens...`);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      // Create contract instance with signer
      const nftContract = new Contract(approval.contract, NFT_ABI, signer);
      
      // Revoke approval for all tokens to this spender
      console.log(`🔄 Revoking approval for all tokens to spender: ${approval.spender}`);
      const tx = await nftContract.setApprovalForAll(approval.spender, false);
      
      setStatusMessage(`Transaction submitted. Waiting for confirmation...`);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      await tx.wait();
      console.log(`✅ Transaction confirmed!`);
      setStatusMessage(`Successfully revoked approval for all tokens!`);
      
      // Refresh approvals after successful revocation
      setTimeout(() => {
        fetchApprovals();
        setStatusMessage('');
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error revoking approval for all:", error);
      setStatusMessage(`Error: ${error.message || "Transaction failed"}`);
    } finally {
      setProcessing(null);
    }
  };
  
  // Handle batch revocation for ERC-721 tokens
  const handleBatchRevokeSelected = async () => {
    if (processing || selectedApprovals.length === 0) return;
    
    // Only process ERC-721 approvals for now
    const selectedERC721 = selectedApprovals.filter(a => a.type === 'ERC-721');
    
    if (selectedERC721.length === 0) {
      setStatusMessage('No ERC-721 approvals selected');
      return;
    }
    
    setProcessing('batch');
    setStatusMessage(`Revoking ${selectedERC721.length} selected approvals...`);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      // Process each approval one by one
      for (let i = 0; i < selectedERC721.length; i++) {
        const approval = selectedERC721[i];
        setStatusMessage(`Processing approval ${i+1} of ${selectedERC721.length}...`);
        
        const nftContract = new Contract(approval.contract, NFT_ABI, signer);
        
        if (approval.tokenId === 'all') {
          // Revoke approval for all tokens
          const tx = await nftContract.setApprovalForAll(approval.spender, false);
          await tx.wait();
        } else {
          // Revoke approval for a specific token
          const tx = await nftContract.approve(ZeroAddress, approval.tokenId);
          await tx.wait();
        }
      }
      
      setStatusMessage(`Successfully revoked ${selectedERC721.length} approvals!`);
      setSelectedApprovals([]); // Clear selections
      
      // Refresh approvals after successful revocation
      setTimeout(() => {
        fetchApprovals();
        setStatusMessage('');
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error in batch revocation:", error);
      setStatusMessage(`Error: ${error.message || "Transaction failed"}`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h2 className="card-title">Approval Dashboard</h2>
        <button 
          className="btn btn-secondary" 
          onClick={fetchApprovals}
          disabled={isLoading || processing}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh Approvals'}
        </button>
      </div>
      <div className="card-body">
        {(isLoading || processing) && (
          <div className="alert alert-info">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span className="visually-hidden">Processing...</span>
            </div>
            <span>{statusMessage || 'Processing...'}</span>
          </div>
        )}
        
        {!isLoading && !processing && statusMessage && (
          <div className="alert alert-success">{statusMessage}</div>
        )}
        
        {selectedApprovals.length > 0 && (
          <div className="alert alert-primary mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <span>{selectedApprovals.length} approvals selected</span>
              <div>
                <button 
                  className="btn btn-sm btn-danger me-2"
                  onClick={handleBatchRevokeSelected}
                  disabled={processing !== null}
                >
                  Revoke Selected
                </button>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setSelectedApprovals([])}
                  disabled={processing !== null}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>Select</th>
                <th>Contract</th>
                <th>Type</th>
                <th>Spender</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvals && approvals.length > 0 ? (
                approvals.map((approval) => (
                  <tr key={approval.id || `${approval.contract}-${approval.spender}-${approval.tokenId || 'all'}`}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        checked={selectedApprovals.some(a => a.id === approval.id)}
                        onChange={() => handleToggleSelect(approval)}
                        disabled={processing !== null}
                      />
                    </td>
                    <td>{approval.tokenSymbol || approval.contract.substring(0, 6) + '...' + approval.contract.substring(approval.contract.length - 4)}</td>
                    <td>{approval.type}</td>
                    <td>{approval.spenderName || (approval.spender && `${approval.spender.substring(0, 6)}...${approval.spender.substring(approval.spender.length - 4)}`)}</td>
                    <td>
                      {approval.type === 'ERC-20' && (
                        <span>Amount: {approval.amount}</span>
                      )}
                      {approval.type === 'ERC-721' && (
                        <span>
                          {approval.tokenId === 'all' 
                            ? 'Approved for all tokens' 
                            : `Token ID: ${approval.tokenId}`}
                        </span>
                      )}
                      {approval.type === 'ERC-1155' && (
                        <span>Token IDs: {approval.tokenIds ? approval.tokenIds.join(', ') : 'all'}</span>
                      )}
                    </td>
                    <td>
                      {approval.type === 'ERC-721' && approval.tokenId !== 'all' && (
                        <button 
                          onClick={() => handleRevokeERC721(approval)} 
                          className="btn btn-danger"
                          disabled={processing !== null}
                        >
                          {processing === approval.id ? 'Processing...' : 'Revoke'}
                        </button>
                      )}
                      {approval.type === 'ERC-721' && approval.tokenId === 'all' && (
                        <button 
                          onClick={() => handleRevokeERC721All(approval)} 
                          className="btn btn-danger"
                          disabled={processing !== null}
                        >
                          {processing === approval.id ? 'Processing...' : 'Revoke All'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-4">No approvals found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboard;

