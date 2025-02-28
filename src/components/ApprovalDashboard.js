import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeResults, setRevokeResults] = useState(null);

  useEffect(() => {
    if (wallet) {
      fetchApprovals();
    }
  }, [wallet]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    setRevokeResults(null);
    console.log("🔄 Starting approval fetch process...");

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("🔍 Wallet Address:", userAddress);

      const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2];
      console.log("📋 Token contracts to check:", tokenContracts);

      console.log("📡 Fetching ERC-20 approvals...");
      const erc20Approvals = await getERC20Approvals(tokenContracts, userAddress) || [];
      console.log("✅ Raw ERC-20 Approvals Fetched:", erc20Approvals);

      console.log("📡 Fetching ERC-721 approvals...");
      const erc721Approvals = await getERC721Approvals(userAddress) || [];
      console.log("✅ Raw ERC-721 Approvals Fetched:", erc721Approvals);

      console.log("📡 Fetching ERC-1155 approvals...");
      const erc1155Approvals = await getERC1155Approvals(userAddress) || [];
      console.log("✅ Raw ERC-1155 Approvals Fetched:", erc1155Approvals);

      console.log("📊 Approval counts before mapping:");
      console.log("ERC-20:", erc20Approvals.length);
      console.log("ERC-721:", erc721Approvals.length);
      console.log("ERC-1155:", erc1155Approvals.length);

      console.log("🔄 Mapping approval objects...");
      const mappedERC20 = erc20Approvals.map((a) => ({
        ...a,
        type: "ERC-20",
        id: `erc20-${a.contract}-${a.spender}`
      }));
      console.log("✅ Mapped ERC-20 approvals:", mappedERC20);
      
      const mappedERC721 = erc721Approvals.map((a) => ({
        ...a,
        type: "ERC-721",
        id: `erc721-${a.contract}-${a.tokenId}-${a.spender}`
      }));
      console.log("✅ Mapped ERC-721 approvals:", mappedERC721);
      
      const mappedERC1155 = erc1155Approvals.map((a) => ({
        ...a,
        type: "ERC-1155",
        id: `erc1155-${a.contract}-${a.spender}`
      }));
      console.log("✅ Mapped ERC-1155 approvals:", mappedERC1155);

      const newApprovals = [
        ...mappedERC20,
        ...mappedERC721,
        ...mappedERC1155
      ];

      console.log("🟢 Final approvals before dispatch:", newApprovals);
      dispatch(setApprovals(newApprovals));
    } catch (error) {
      console.error("❌ Error fetching approvals:", error);
      dispatch(setApprovals([]));
    } finally {
      setIsLoading(false);
    }
  };

  // Define handleSelectApproval
  const handleSelectApproval = (approval) => {
    console.log("🔍 Toggling selection for:", approval);
    
    setSelectedApprovals((prev) => {
      const isSelected = prev.some((a) => 
        a.contract === approval.contract && a.spender === approval.spender
      );

      if (isSelected) {
        return prev.filter((a) => 
          !(a.contract === approval.contract && a.spender === approval.spender)
        );
      } else {
        return [...prev, approval];
      }
    });
  };

  // Define handleBatchRevoke
const handleBatchRevoke = async () => {
    if (selectedApprovals.length === 0) {
        console.warn("⚠️ No approvals selected");
        return;
    }

    setIsLoading(true);
    setRevokeResults(null);

    try {
        const provider = await getProvider();
        const signer = await provider.getSigner();
        console.log("🔄 Starting batch revocation with signer:", await signer.getAddress());

        // Check selected ERC-721 approvals
        const erc721Approvals = selectedApprovals.filter(a => a.type === 'ERC-721');

        if (erc721Approvals.length === 0) {
            console.log("ℹ️ No ERC-721 approvals selected.");
            setRevokeResults({ success: true, message: "No ERC-721 approvals to revoke." });
            return;
        }

        console.log("🚀 Revoking ERC-721 approvals:", erc721Approvals);
        
        // Make sure to await for this revocation
        const revokeResults = await batchRevokeERC721Approvals(erc721Approvals, signer);
        console.log("✅ Revocation results:", revokeResults);
        
        setRevokeResults({
            success: true,
            failed: revokeResults.failed.length,
            successful: revokeResults.successful.length,
            details: revokeResults
        });

        // Clear selections on success
        setSelectedApprovals([]);
    } catch (error) {
        console.error("❌ Batch revocation error:", error);
        setRevokeResults({
            success: false,
            message: error.message || "Failed to revoke approvals"
        });
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h2 className="card-title">Approval Dashboard</h2>
        <button 
          className="btn btn-secondary" 
          onClick={fetchApprovals}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh Approvals'}
        </button>
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
            {revokeResults && (
              <div className={`alert ${revokeResults.success ? 'alert-success' : 'alert-danger'} mb-4`}>
                {revokeResults.success ? (
                  <div>
                    <h5>✅ Batch Revocation Results</h5>
                    <p>Successfully revoked {revokeResults.successful} approval(s)</p>
                    {revokeResults.failed > 0 && <p>Failed to revoke {revokeResults.failed} approval(s)</p>}
                  </div>
                ) : (
                  <div>
                    <h5>❌ Revocation Error</h5>
                    <p>{revokeResults.message}</p>
                  </div>
                )}
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
                    <th>Approved Amount/Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.length > 0 ? (
                    approvals.map((approval) => (
                      <tr key={approval.id}>
                        <td>
                          <input 
                            type="checkbox" 
                            className="form-check-input"
                            onChange={() => handleSelectApproval(approval)}
                            checked={selectedApprovals.some(a => a.id === approval.id)}
                          />
                        </td>
                        <td className="text-truncate" style={{ maxWidth: '150px' }}>
                          {approval.tokenSymbol || approval.contract}
                        </td>
                        <td>{approval.type}</td>
                        <td className="text-truncate" style={{ maxWidth: '150px' }}>
                          {approval.spenderName || approval.spender}
                        </td>
                        <td>{approval.type === "ERC-20" ? approval.amount : approval.isApproved ? "✅ Approved" : "❌ Not Approved"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-4">No approvals found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="small text-muted">
                {selectedApprovals.length} approval(s) selected
              </div>
              <button 
                className="btn btn-danger" 
                onClick={handleBatchRevoke}
                disabled={isLoading || selectedApprovals.length === 0}
              >
                {isLoading ? 'Revoking...' : `🚨 Revoke Selected (${selectedApprovals.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;

