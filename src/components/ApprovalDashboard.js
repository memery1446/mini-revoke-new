"use client"

import React, { useState, useEffect } from "react";
import { batchRevokeERC20Approvals } from "../components/BatchRevoke";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals";
import { batchRevokeERC1155Approvals } from "../utils/erc1155Approvals";
import { ethers } from "ethers";
import { TOKEN_ABI, CONTRACT_ADDRESSES } from "../constants/abis";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { useSelector } from "react-redux";

const ApprovalDashboard = () => {
  // Get wallet from Redux instead of props
  const wallet = useSelector((state) => state.web3.account);
  const [approvals, setApprovals] = useState([])
  const [selectedApprovals, setSelectedApprovals] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Define contractAddresses object
  const contractAddresses = {
    erc721: CONTRACT_ADDRESSES.TestNFT,
    erc1155: CONTRACT_ADDRESSES.ERC1155
  };

  useEffect(() => {
    if (wallet) {
      fetchApprovals()
    }
  }, [wallet])

const fetchApprovals = async () => {
  setIsLoading(true)
  console.log("🔄 Fetching approvals...")
  try {
    // Pass specific token contracts and wallet address
    const tokenContracts = [
      CONTRACT_ADDRESSES.TK1,
      CONTRACT_ADDRESSES.TK2,
    ];
    const erc20Approvals = await getERC20Approvals(tokenContracts, wallet) || [];
    
    // Handle ERC-721 approvals - could be a boolean
    let erc721Result;
    let erc721Approvals = [];
    try {
      erc721Result = await getERC721Approvals(wallet, contractAddresses.erc721);
      console.log("ERC-721 approval result:", erc721Result);
      
      // If it's a boolean, convert to array with appropriate format
      if (typeof erc721Result === 'boolean') {
        erc721Approvals = erc721Result ? 
          [{ isApproved: true, spender: CONTRACT_ADDRESSES.MockSpender }] : [];
      } else if (Array.isArray(erc721Result)) {
        erc721Approvals = erc721Result;
      }
    } catch (err) {
      console.error("Error getting ERC-721 approvals:", err);
    }
    
    // Handle ERC-1155 approvals
    let erc1155Approvals = [];
    try {
      const result = await getERC1155Approvals(wallet) || [];
      erc1155Approvals = Array.isArray(result) ? result : [];
    } catch (err) {
      console.error("Error getting ERC-1155 approvals:", err);
    }

    // Make sure each item has a unique ID
    setApprovals([
      ...erc20Approvals.map((a) => ({ 
        ...a, 
        type: "ERC-20",
        id: `erc20-${a.contract || "unknown"}-${a.spender || "unknown"}` 
      })),
      ...erc721Approvals.map((a) => ({ 
        ...a, 
        type: "ERC-721",
        id: `erc721-${a.tokenId || "0"}-${a.spender || CONTRACT_ADDRESSES.MockSpender}` 
      })),
      ...erc1155Approvals.map((a) => ({ 
        ...a, 
        type: "ERC-1155",
        id: `erc1155-${a.spender || "unknown"}` 
      })),
    ]);
  } catch (error) {
    console.error("❌ Error fetching approvals:", error)
    setApprovals([]); // Set empty array on error
  } finally {
    setIsLoading(false)
  }
}

  const handleSelectApproval = (approval) => {
    setSelectedApprovals((prev) =>
      prev.some((a) => a.id === approval.id) ? prev.filter((a) => a.id !== approval.id) : [...prev, approval],
    )
  }

  const handleBatchRevoke = async () => {
    console.log("🚨 Revoking selected approvals...")
    setIsLoading(true)
    try {
      // Get token contracts from selected approvals
      const selectedERC20s = selectedApprovals
        .filter((a) => a.type === "ERC-20")
        .map((a) => a.contract);
        
      if (selectedERC20s.length > 0) {
        // Get the provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        await batchRevokeERC20Approvals(selectedERC20s, signer);
      }

      // Handle ERC-721 approvals
      const selectedERC721s = selectedApprovals
        .filter((a) => a.type === "ERC-721")
        .map((a) => a.tokenId);
        
      if (selectedERC721s.length > 0) {
        await batchRevokeERC721Approvals(
          wallet,
          selectedERC721s
        );
      }

      // Handle ERC-1155 approvals
      const selectedERC1155s = selectedApprovals
        .filter((a) => a.type === "ERC-1155")
        .map((a) => a.spender);
        
      if (selectedERC1155s.length > 0) {
        await batchRevokeERC1155Approvals(selectedERC1155s);
      }
      
      alert("Batch revocation complete!");
      fetchApprovals();
    } catch (error) {
      console.error("❌ Error in batch revocation:", error);
      alert("Error in batch revocation: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleRevokeSingle = async (approval) => {
    console.log(`🚨 Revoking approval for ${approval.contract}...`);
    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      let tx;
      if (approval.type === "ERC-20") {
        const tokenContract = new ethers.Contract(approval.contract, TOKEN_ABI, signer);
        tx = await tokenContract.approve(approval.spender, 0);
      } else if (approval.type === "ERC-721") {
        const nftContract = new ethers.Contract(contractAddresses.erc721, [
          "function setApprovalForAll(address operator, bool approved) external"
        ], signer);
        tx = await nftContract.setApprovalForAll(approval.spender, false);
      } else if (approval.type === "ERC-1155") {
        const erc1155Contract = new ethers.Contract(contractAddresses.erc1155, [
          "function setApprovalForAll(address operator, bool approved) external"
        ], signer);
        tx = await erc1155Contract.setApprovalForAll(approval.spender, false);
      }

      await tx.wait();
      console.log("✅ Single approval revoked!");
      fetchApprovals();
    } catch (error) {
      console.error("❌ Error revoking approval:", error);
      alert("Error revoking approval: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h2 className="card-title">Approval Dashboard</h2>
      </div>
      <div className="card-body">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading approvals...</span>
            </div>
            <p className="mt-3">Loading approvals...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Select</th>
                    <th>Contract</th>
                    <th>Type</th>
                    <th>Spender</th>
                    <th>Approved Amount/Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.length > 0 ? (
                    approvals.map((approval, index) => (
                      <tr key={index}>
                        <td>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={selectedApprovals.some((a) => a.id === approval.id)}
                              onChange={() => handleSelectApproval(approval)}
                              id={`approval-${index}`}
                            />
                          </div>
                        </td>
                        <td>
                          <span className="d-inline-block text-truncate" style={{maxWidth: "150px"}}>
                            {approval.contract}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            approval.type === "ERC-20" ? "bg-primary" :
                            approval.type === "ERC-721" ? "bg-success" : "bg-info"
                          }`}>
                            {approval.type}
                          </span>
                        </td>
                        <td>
                          <span className="d-inline-block text-truncate" style={{maxWidth: "150px"}}>
                            {approval.spender}
                          </span>
                        </td>
                        <td>
                          {approval.type === "ERC-20" ? (
                            approval.amount
                          ) : approval.isApproved ? (
                            <span className="badge bg-success">Approved</span>
                          ) : (
                            <span className="badge bg-secondary">Not Approved</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRevokeSingle(approval)}
                            disabled={isLoading}
                          >
                            🚨 Revoke
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="alert alert-info mb-0">
                          <i className="bi bi-info-circle me-2"></i>
                          No approvals found. Your wallet has not approved any contracts to spend your tokens.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {selectedApprovals.length > 0 && (
              <div className="d-flex justify-content-end mt-3">
                <button 
                  className="btn btn-warning" 
                  onClick={handleBatchRevoke} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Revoking...
                    </>
                  ) : (
                    <>🚨 Revoke Selected Approvals ({selectedApprovals.length})</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="card-footer bg-light">
        <small className="text-muted">
          Last refreshed: {new Date().toLocaleTimeString()}
          <button 
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={fetchApprovals}
            disabled={isLoading}
          >
            Refresh
          </button>
        </small>
      </div>
    </div>
  )
}

export default ApprovalDashboard