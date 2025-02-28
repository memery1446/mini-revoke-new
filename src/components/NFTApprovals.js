import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";

const NFTApprovals = ({ contractAddress, spender }) => {
  const [approvals, setApprovals] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (contractAddress && spender && window.ethereum) {
      fetchApprovals();
    }
  }, [contractAddress, spender]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 Fetching NFT approvals for contract:", contractAddress);

      if (!contractAddress || !ethers.isAddress(contractAddress)) {
        throw new Error("❌ Invalid or missing contract address.");
      }
      if (!spender || !ethers.isAddress(spender)) {
        throw new Error("❌ Invalid or missing spender address.");
      }
      if (!window.ethereum) {
        throw new Error("❌ MetaMask is not installed.");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const owner = await signer.getAddress();

      console.log("📌 Checking isApprovedForAll for:", owner, spender);

      const abi = [
        "function isApprovedForAll(address owner, address operator) view returns (bool)",
        "function setApprovalForAll(address operator, bool approved) external",
        "function getApproved(uint256 tokenId) view returns (address)"
      ];
      
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const isApprovedForAll = await contract.isApprovedForAll(owner, spender);

      console.log("✅ NFT Approval Status:", isApprovedForAll);
      setApprovals(isApprovedForAll);
    } catch (error) {
      console.error("❌ Error fetching approvals:", error);
      setError(error.message);
      setApprovals(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setRevoking(true);
      setError(null);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const abi = [
        "function setApprovalForAll(address operator, bool approved) external"
      ];
      
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      console.log("🚨 Revoking approval...");
      const tx = await contract.setApprovalForAll(spender, false);
      await tx.wait();
      
      console.log("✅ Successfully revoked approval");
      window.store.dispatch({ type: "web3/setApprovals", payload: [] });
window.debugApp.logState(); // Check Redux update

      setApprovals(false);
    } catch (error) {
      console.error("❌ Error revoking approval:", error);
      setError(error.message);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <h3 className="mb-0">NFT Approvals</h3>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Fetching approvals...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <strong>⚠️ Error:</strong> {error}
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <span className="me-3">Approval Status:</span>
              <span className={`badge ${approvals ? 'bg-success' : 'bg-secondary'}`}>
                {approvals ? 'Approved' : 'Not Approved'}
              </span>
            </div>
            {approvals && (
              <button
                className="btn btn-danger"
                onClick={handleRevoke}
                disabled={revoking}
              >
                {revoking ? 'Revoking...' : '🚨 Revoke Approval'}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="card-footer">
        <small className="text-muted">
          Contract: {contractAddress ? 
            `${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}` : 
            'Not specified'}
        </small>
      </div>
    </div>
  );
};

export default NFTApprovals;
