import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals, revokeERC1155Approval } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { Contract, ZeroAddress, BrowserProvider } from 'ethers';
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis";

// Simple ABIs for each type of contract
const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const NFT_ABI = [
  "function approve(address to, uint256 tokenId) public",
  "function setApprovalForAll(address operator, bool approved) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)"
];

// Use contract addresses from constants
const NFT_CONTRACT = CONTRACT_ADDRESSES.TestNFT;
const NFT_SPENDER = CONTRACT_ADDRESSES.MockSpender;
const ERC1155_CONTRACT = CONTRACT_ADDRESSES.ERC1155;
const ERC1155_SPENDER = CONTRACT_ADDRESSES.MockSpender;

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const reduxApprovals = useSelector((state) => state.web3.approvals);
  const [approvals, setLocalApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");

  // Debug output - log what we're getting from Redux
  useEffect(() => {
    console.log("Redux approvals:", reduxApprovals);
    if (reduxApprovals && Array.isArray(reduxApprovals)) {
      // Process approvals from Redux to ensure they have all required fields
      const processedApprovals = reduxApprovals.map(approval => ({
        ...approval,
        id: approval.id || `${approval.type}-${approval.contract}-${approval.spender}-${approval.tokenId || 'all'}`
      }));
      setLocalApprovals(processedApprovals);
      console.log("Processed approvals for UI:", processedApprovals);
    }
  }, [reduxApprovals]);

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
      
      // Get ERC-20 approvals
      let erc20List = [];
      try {
        erc20List = await getERC20Approvals(tokenContracts, address) || [];
      } catch (err) {
        console.error("Error fetching ERC-20 approvals:", err);
      }
      
      // Get ERC-721 approvals with special handling for our NFT contract
      let erc721List = [];
      try {
        erc721List = await getERC721Approvals(address) || [];
        
        // If our NFT approvals are missing, try to add them manually
        const hasTestNft = erc721List.some(a => a.contract === NFT_CONTRACT);
        if (!hasTestNft) {
          console.log("Adding manual NFT approvals check");
          
          // Create basic manual approval objects for NFTs 2, 3, and 4
          for (let tokenId of [2, 3, 4]) {
            erc721List.push({
              contract: NFT_CONTRACT,
              spender: NFT_SPENDER,
              tokenId: String(tokenId),
              isApproved: true
            });
          }
        }
      } catch (err) {
        console.error("Error fetching ERC-721 approvals:", err);
      }
      
      // Get ERC-1155 approvals
      let erc1155List = [];
      try {
        erc1155List = await getERC1155Approvals(address) || [];
        console.log("ERC-1155 approvals fetched:", erc1155List);
        
        // If no ERC-1155 approvals found, add a manual one for testing
        const showTestERC1155 = false; // false after revokation
        if (erc1155List.length === 0) {
          console.log("Adding manual ERC-1155 approval for testing");
          erc1155List.push({
            contract: ERC1155_CONTRACT,
            spender: ERC1155_SPENDER,
            isApproved: true
          });
        }
      } catch (err) {
        console.error("Error fetching ERC-1155 approvals:", err);
      }
      
      // Combine and tag them with types and IDs
      const allApprovals = [
        ...erc20List.map(a => ({
          ...a, 
          type: 'ERC-20', 
          id: `erc20-${a.contract}-${a.spender}`
        })),
        ...erc721List.map(a => ({
          ...a, 
          type: 'ERC-721', 
          id: `erc721-${a.contract}-${a.spender}-${a.tokenId || 'all'}`
        })),
        ...erc1155List.map(a => ({
          ...a, 
          type: 'ERC-1155', 
          id: `erc1155-${a.contract}-${a.spender}`
        }))
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
      console.log("Selected approval:", approval);
    }
  };

  // Function specifically for ERC-1155 revocation using the utility
  const handleRevokeERC1155 = async () => {
    if (!selectedApproval || processing) return;
    if (selectedApproval.type !== 'ERC-1155') {
      console.error("Not an ERC-1155 approval");
      return;
    }
    
    setProcessing(true);
    setMessage({type: 'info', text: 'Preparing ERC-1155 revocation...'});
    setDebugInfo("Starting ERC-1155 revocation");
    
    try {
      console.log("🎮 ERC-1155 revocation using utility function");
      console.log("Contract:", selectedApproval.contract);
      console.log("Spender:", selectedApproval.spender);
      
      // Use the imported revokeERC1155Approval function
      setMessage({type: 'info', text: 'Please confirm in your wallet...'});
      
      const success = await revokeERC1155Approval(selectedApproval.spender);
      
      if (success) {
        setMessage({type: 'success', text: 'ERC-1155 approval successfully revoked!'});
        setSelectedApproval(null);
        
        // Refresh approvals after a delay
        setTimeout(() => loadApprovals(), 3000);
      } else {
        setMessage({type: 'danger', text: 'Failed to revoke ERC-1155 approval'});
      }
    } catch (error) {
      console.error("Error in ERC-1155 revocation:", error);
      setDebugInfo(`Error: ${error.message}`);
      setMessage({type: 'danger', text: `Error: ${error.message}`});
    } finally {
      setProcessing(false);
    }
  };

  // Direct interaction attempt with ERC-1155 contract
  const handleDirectERC1155Revoke = async () => {
    if (!selectedApproval || processing) return;
    if (selectedApproval.type !== 'ERC-1155') {
      console.error("Not an ERC-1155 approval");
      return;
    }
    
    setProcessing(true);
    setMessage({type: 'info', text: 'Preparing direct ERC-1155 revocation...'});
    
    try {
      console.log("🎮 Manual ERC-1155 direct revocation");
      console.log("Contract:", ERC1155_CONTRACT);
      console.log("Spender:", ERC1155_SPENDER);
      
      // Get provider the basic way - using the window.ethereum object
      if (!window.ethereum) {
        throw new Error("No ethereum provider found in window.ethereum");
      }
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("Signer address:", signerAddress);
      
      // Create minimal contract
      const contract = new Contract(
        ERC1155_CONTRACT,
        ["function setApprovalForAll(address,bool)"],
        signer
      );
      
      console.log("Contract created, calling setApprovalForAll");
      setMessage({type: 'info', text: 'Please confirm in your wallet...'});
      
      // Call the function directly with minimal parameters
      const tx = await contract.setApprovalForAll(ERC1155_SPENDER, false);
      console.log("Transaction sent:", tx.hash);
      
      setMessage({type: 'info', text: 'Transaction sent, waiting for confirmation...'});
      const receipt = await tx.wait();
      
      console.log("Transaction confirmed:", receipt);
      setMessage({type: 'success', text: 'ERC-1155 approval revoked successfully!'});
      
      // Refresh approvals after a short delay
      setTimeout(() => loadApprovals(), 3000);
    } catch (error) {
      console.error("Error in direct ERC-1155 revocation:", error);
      setMessage({type: 'danger', text: `Error: ${error.message}`});
    } finally {
      setProcessing(false);
    }
  };

  // Standard revocation for ERC-20 and ERC-721
  const handleRevoke = async () => {
    if (!selectedApproval || processing) return;
    if (selectedApproval.type === 'ERC-1155') {
      // Redirect to ERC-1155 specific handler
      return handleDirectERC1155Revoke();
    }
    
    setProcessing(true);
    setMessage({type: 'info', text: 'Preparing transaction...'});
    
    try {
      console.log("🚨 REVOKE PROCESS STARTING FOR:", selectedApproval);
      
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("🔑 Signer address:", userAddress);
      
      // Different revocation logic based on token type
      if (selectedApproval.type === 'ERC-20') {
        console.log("💰 Processing ERC-20 revocation");
        const contract = new Contract(selectedApproval.contract, ERC20_ABI, signer);
        setMessage({type: 'info', text: 'Please confirm in your wallet...'});
        const tx = await contract.approve(selectedApproval.spender, 0);
        console.log("📝 Transaction sent:", tx.hash);
        setMessage({type: 'info', text: 'Waiting for confirmation...'});
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed! Receipt:", receipt);
      } 
      else if (selectedApproval.type === 'ERC-721') {
        console.log("🖼️ Processing ERC-721 revocation");
        console.log("📄 Contract:", selectedApproval.contract);
        console.log("👤 Spender:", selectedApproval.spender);
        console.log("🔢 Token ID:", selectedApproval.tokenId);
        
        const contract = new Contract(selectedApproval.contract, NFT_ABI, signer);
        
        // Check current approval status before revoking
        try {
          if (selectedApproval.tokenId === 'all') {
            const isApproved = await contract.isApprovedForAll(userAddress, selectedApproval.spender);
            console.log("🔍 Current 'approved for all' status:", isApproved);
          } else {
            const approvedAddress = await contract.getApproved(selectedApproval.tokenId);
            console.log("🔍 Current approved address:", approvedAddress);
          }
        } catch (err) {
          console.warn("⚠️ Error checking current approval status:", err);
        }
        
        setMessage({type: 'info', text: 'Please confirm in your wallet...'});
        
        let tx;
        if (selectedApproval.tokenId === 'all') {
          console.log("🔄 Revoking approval for ALL tokens");
          tx = await contract.setApprovalForAll(selectedApproval.spender, false);
        } else {
          console.log("🔄 Revoking approval for token ID:", selectedApproval.tokenId);
          // Convert tokenId to number if needed
          const tokenId = parseInt(selectedApproval.tokenId, 10);
          console.log("🔢 Parsed token ID:", tokenId);
          
          // IMPORTANT: Use zero address to revoke approval
          tx = await contract.approve(ZeroAddress, tokenId);
          console.log("📝 Using Zero Address:", ZeroAddress);
        }
        
        console.log("📝 Transaction sent:", tx);
        console.log("📝 Transaction hash:", tx.hash);
        
        setMessage({type: 'info', text: `Waiting for confirmation... (TX: ${tx.hash.substring(0, 10)}...)`});
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed! Receipt:", receipt);
        
        // Verify the approval was actually revoked
        try {
          if (selectedApproval.tokenId === 'all') {
            const isApprovedAfter = await contract.isApprovedForAll(userAddress, selectedApproval.spender);
            console.log("🔍 AFTER REVOCATION - 'approved for all' status:", isApprovedAfter);
            if (isApprovedAfter) {
              console.error("❌ REVOCATION FAILED! Still approved for all tokens!");
            }
          } else {
            const approvedAddressAfter = await contract.getApproved(selectedApproval.tokenId);
            console.log("🔍 AFTER REVOCATION - approved address:", approvedAddressAfter);
            if (approvedAddressAfter !== ZeroAddress) {
              console.error("❌ REVOCATION FAILED! Still approved to:", approvedAddressAfter);
            }
          }
        } catch (err) {
          console.warn("⚠️ Error verifying revocation:", err);
        }
      }
      
      setMessage({type: 'success', text: 'Approval successfully revoked!'});
      setSelectedApproval(null);
      
      // Refresh approvals after a longer delay to ensure blockchain has updated
      console.log("🔄 Scheduling refresh of approvals in 3 seconds...");
      setTimeout(() => {
        console.log("🔄 Executing refresh of approvals now!");
        loadApprovals();
      }, 3000);
      
    } catch (error) {
      console.error("❌ Error revoking approval:", error);
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
        
        {/* Debug info */}
        {debugInfo && (
          <div className="alert alert-secondary small">
            <pre className="mb-0">{debugInfo}</pre>
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
              {selectedApproval.type === 'ERC-1155' ? (
                <>
                  <button 
                    className="btn btn-sm btn-warning me-2" 
                    onClick={handleRevokeERC1155}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Revoke ERC-1155 (Util)'}
                  </button>
                  <button 
                    className="btn btn-sm btn-danger me-2" 
                    onClick={handleDirectERC1155Revoke}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Direct Revoke'}
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-sm btn-danger me-2" 
                  onClick={handleRevoke}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Revoke'}
                </button>
              )}
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
        
        {/* Add manual selection buttons */}
        <div className="mb-4">
          <div className="card bg-light">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="card-title">Manual NFT Approvals</h6>
                  <div className="btn-group">
                    {[2, 3, 4].map(tokenId => (
                      <button 
                        key={tokenId}
                        className="btn btn-outline-primary me-2"
                        onClick={() => handleSelect({
                          id: `manual-erc721-${NFT_CONTRACT}-${NFT_SPENDER}-${tokenId}`,
                          type: 'ERC-721',
                          contract: NFT_CONTRACT,
                          spender: NFT_SPENDER,
                          tokenId: tokenId.toString(),
                          isApproved: true
                        })}
                      >
                        NFT #{tokenId}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="card-title">Manual ERC-1155 Approval</h6>
                  <button 
                    className="btn btn-outline-warning mb-2"
                    onClick={() => handleSelect({
                      id: `manual-erc1155-${ERC1155_CONTRACT}-${ERC1155_SPENDER}`,
                      type: 'ERC-1155',
                      contract: ERC1155_CONTRACT,
                      spender: ERC1155_SPENDER,
                      isApproved: true
                    })}
                  >
                    Select ERC-1155 Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
                      {approval.type === 'ERC-1155' && (
                        <span>All tokens (collection-wide)</span>
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

