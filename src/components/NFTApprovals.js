import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";

const NFTApprovals = ({ contractAddress, spender }) => {
  const [approvals, setApprovals] = useState([]); // Change initial state to array
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

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const owner = await signer.getAddress();

      const fetchedApprovals = await getERC721Approvals(owner);
      setApprovals(fetchedApprovals);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (tokenId) => {
    try {
      setRevoking(true);
      setError(null);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, [
        "function batchRevokeApprovals(uint256[] memory tokenIds) external"
      ], signer);

      console.log("🚨 Revoking approval for token ID:", tokenId);
      const tx = await contract.batchRevokeApprovals([tokenId]);
      await tx.wait();

      console.log(`✅ Successfully revoked approval for token ID: ${tokenId}`);
      
      // Refresh approvals
      fetchApprovals();
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
          approvals.map((approval) => (
            <div key={approval.tokenId} className="d-flex align-items-center justify-content-between my-2">
              <div>
                <span className="me-3">Token ID: {approval.tokenId}</span>
                <span className={`badge ${approval.isApproved ? 'bg-success' : 'bg-secondary'}`}>
                  {approval.isApproved ? 'Approved' : 'Not Approved'}
                </span>
              </div>
              {approval.isApproved && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleRevoke(approval.tokenId)}
                  disabled={revoking}
                >
                  {revoking ? 'Revoking...' : '🚨 Revoke Approval'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
      <div className="card-footer">
        <small className="text-muted">
          Contract: {contractAddress ? `${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}` : 'Not specified'}
        </small>
      </div>
    </div>
  );
};

export default NFTApprovals;

