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
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);
  
  useEffect(() => {
    if (wallet) {
      fetchApprovals();
    }
  }, [wallet]);

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

  // Handle single selection (radio button style)
  const handleSelectApproval = (approval) => {
    setSelectedApproval(approval);
    console.log("Selected approval:", approval);
  };

  // Handle revocation of the selected approval
  const handleRevokeSelected = async () => {
    if (!selectedApproval || processing) return;
    
    setProcessing(true);
    setStatusMessage(`Revoking approval...`);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      if (selectedApproval.type === 'ERC-721') {
        const nftContract = new Contract(selectedApproval.contract, NFT_ABI, signer);
        
        if (selectedApproval.tokenId === 'all') {
          // If it's an "approve for all" type approval
          console.log(`🔄 Revoking approval for all tokens to spender: ${selectedApproval.spender}`);
          const tx = await nftContract.setApprovalForAll(selectedApproval.spender, false);
          
          setStatusMessage(`Transaction submitted. Waiting for confirmation...`);
          console.log(`📤 Transaction sent: ${tx.hash}`);
          
          await tx.wait();
        } else {
          // If it's a specific token approval
          console.log(`🔄 Revoking approval for token ID ${selectedApproval.tokenId}`);
          const tx = await nftContract.approve(ZeroAddress, selectedApproval.tokenId);
          
          setStatusMessage(`Transaction submitted. Waiting for confirmation...`);
          console.log(`📤 Transaction sent: ${tx.hash}`);
          
          await tx.wait();
        }
        
        console.log(`✅ Transaction confirmed!`);
        setStatusMessage(`Successfully revoked approval!`);
        setSelectedApproval(null); // Clear selection
        
        // Refresh approvals after successful revocation
        setTimeout(() => {
          fetchApprovals();
          setStatusMessage('');
        }, 2000);
      }
      // We can add handlers for ERC-20 and ERC-1155 here later
      
    } catch (error) {
      console.error("❌ Error revoking approval:", error);
      setStatusMessage(`Error: ${error.message || "Transaction failed"}`);
    } finally {
      setProcessing(false);
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
        {/* Status messages */}
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
        
        {/* Show selected approval and action button */}
        {selectedApproval && !processing && (
          <div className="alert alert-primary mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Selected:</strong> {selectedApproval.type} 
                {selectedApproval.tokenId && ` (Token ID: ${selectedApproval.tokenId})`} 
                to {selectedApproval.spenderName || selectedApproval.spender}
              </div>
              <button 
                className="btn btn-danger"
                onClick={handleRevokeSelected}
                disabled={processing}
              >
                Revoke Selected
              </button>
            </div>
          </div>
        )}
        
        {/* Approvals table */}
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>Select</th>
                <th>Contract</th>
                <th>Type</th>
                <th>Spender</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {approvals && approvals.length > 0 ? (
                approvals.map((approval) => (
                  <tr 
                    key={approval.id || `${approval.contract}-${approval.spender}-${approval.tokenId || 'all'}`}
                    className={selectedApproval && selectedApproval.id === approval.id ? 'table-primary' : ''}
                    onClick={() => handleSelectApproval(approval)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="form-check">
                        <input 
                          type="radio" 
                          className="form-check-input" 
                          name="approvalRadio"
                          checked={selectedApproval && selectedApproval.id === approval.id} 
                          onChange={() => handleSelectApproval(approval)}
                          disabled={processing}
                        />
                      </div>
                    </td>
                    <td>{approval.tokenSymbol || (approval.contract && `${approval.contract.substring(0, 6)}...${approval.contract.substring(approval.contract.length - 4)}`)}</td>
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

