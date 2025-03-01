import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { Contract, ZeroAddress } from 'ethers';

// Simple ABIs for each type of contract
const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const NFT_ABI = [
  "function approve(address to, uint256 tokenId) public",
  "function setApprovalForAll(address operator, bool approved) external"
];

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals || []);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);

  // Load approvals when wallet connects
  useEffect(() => {
    if (wallet) {
      loadApprovals();
    }
  }, [wallet]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Load all approvals
  const loadApprovals = async () => {
    if (!wallet || isLoading) return;
    
    setIsLoading(true);
    setMessage({type: 'info', text: 'Loading approvals...'});
    setSelectedApproval(null);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      console.log("Fetching approvals for:", address);
      
      // Get all types of approvals
      const tokenContracts = ["0x483FA7f61170c19276B3DbB399e735355Ae7676a", "0xE7B9Ede68593354aff96690600D008A40519D3CF"];
      const erc20List = await getERC20Approvals(tokenContracts, address) || [];
      const erc721List = await getERC721Approvals(address) || [];
      const erc1155List = await getERC1155Approvals(address) || [];
      
      // Combine and tag them with types
      const allApprovals = [
        ...erc20List.map(a => ({...a, type: 'ERC-20', id: `erc20-${a.contract}-${a.spender}`})),
        ...erc721List.map(a => ({...a, type: 'ERC-721', id: `erc721-${a.contract}-${a.spender}-${a.tokenId || 'all'}`})),
        ...erc1155List.map(a => ({...a, type: 'ERC-1155', id: `erc1155-${a.contract}-${a.spender}`}))
      ];
      
      console.log("Found approvals:", allApprovals);
      dispatch(setApprovals(allApprovals));
      
      setMessage({type: 'success', text: `Found ${allApprovals.length} approvals`});
    } catch (error) {
      console.error("Error loading approvals:", error);
      setMessage({type: 'danger', text: `Error: ${error.message}`});
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection of an approval
  const handleSelect = (approval) => {
    // If already selected, deselect it
    if (selectedApproval && selectedApproval.id === approval.id) {
      setSelectedApproval(null);
    } else {
      setSelectedApproval(approval);
    }
  };

  // Revoke the selected approval
  const handleRevoke = async () => {
    if (!selectedApproval || processing) return;
    
    setProcessing(true);
    setMessage({type: 'info', text: 'Preparing transaction...'});
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      // Different revocation logic based on token type
      if (selectedApproval.type === 'ERC-20') {
        const contract = new Contract(selectedApproval.contract, ERC20_ABI, signer);
        setMessage({type: 'info', text: 'Please confirm in your wallet...'});
        const tx = await contract.approve(selectedApproval.spender, 0);
        setMessage({type: 'info', text: 'Waiting for confirmation...'});
        await tx.wait();
      } 
      else if (selectedApproval.type === 'ERC-721') {
        const contract = new Contract(selectedApproval.contract, NFT_ABI, signer);
        setMessage({type: 'info', text: 'Please confirm in your wallet...'});
        
        let tx;
        if (selectedApproval.tokenId === 'all') {
          tx = await contract.setApprovalForAll(selectedApproval.spender, false);
        } else {
          tx = await contract.approve(ZeroAddress, selectedApproval.tokenId);
        }
        
        setMessage({type: 'info', text: 'Waiting for confirmation...'});
        await tx.wait();
      }
      
      setMessage({type: 'success', text: 'Approval successfully revoked!'});
      setSelectedApproval(null);
      
      // Refresh approvals after a short delay
      setTimeout(() => loadApprovals(), 2000);
      
    } catch (error) {
      console.error("Error revoking approval:", error);
      setMessage({type: 'danger', text: `Error: ${error.message}`});
    } finally {
      setProcessing(false);
    }
  };

  // Render an empty state if no wallet connected
  if (!wallet) {
    return (
      <div className="card text-center p-5">
        <h4>Connect your wallet to view approvals</h4>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Token Approvals</h5>
        <button 
          className="btn btn-outline-primary" 
          onClick={loadApprovals}
          disabled={isLoading || processing}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      <div className="card-body">
        {/* Status messages */}
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}
        
        {/* Selected approval action */}
        {selectedApproval && (
          <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
            <div>
              <span>Selected: </span>
              <strong>{selectedApproval.type}</strong>
              {selectedApproval.tokenId && <span> Token #{selectedApproval.tokenId}</span>}
              <span> to </span>
              <code className="ms-1">{selectedApproval.spender?.substring(0, 8)}...</code>
            </div>
            <div>
              <button 
                className="btn btn-sm btn-danger me-2" 
                onClick={handleRevoke}
                disabled={processing}
              >
                Revoke
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedApproval(null)}
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Approvals table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Type</th>
                <th>Contract</th>
                <th>Spender</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvals.length > 0 ? (
                approvals.map(approval => (
                  <tr 
                    key={approval.id} 
                    className={selectedApproval?.id === approval.id ? 'table-primary' : ''}
                  >
                    <td>
                      <span className={`badge bg-${approval.type === 'ERC-20' 
                        ? 'success' 
                        : approval.type === 'ERC-721' 
                          ? 'primary' 
                          : 'warning'}`}
                      >
                        {approval.type}
                      </span>
                    </td>
                    <td>
                      <code>{approval.tokenSymbol || approval.contract?.substring(0, 8)}...</code>
                    </td>
                    <td>
                      <code>{approval.spender?.substring(0, 8)}...</code>
                    </td>
                    <td>
                      {approval.type === 'ERC-20' && <span>Amount: Unlimited</span>}
                      {approval.type === 'ERC-721' && (
                        <span>{approval.tokenId === 'all' ? 'All tokens' : `Token #${approval.tokenId}`}</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className={`btn btn-sm ${selectedApproval?.id === approval.id 
                          ? 'btn-outline-secondary' 
                          : 'btn-outline-primary'}`}
                        onClick={() => handleSelect(approval)}
                        disabled={processing || isLoading}
                      >
                        {selectedApproval?.id === approval.id ? 'Deselect' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    {isLoading ? (
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    ) : (
                      'No approvals found'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboard;
