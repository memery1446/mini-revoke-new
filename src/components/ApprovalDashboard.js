import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals";
import { batchRevokeERC1155Approvals } from "../utils/erc1155Approvals";

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

const uniqueApprovals = Array.from(new Map(newApprovals.map(item => 
      [item.id, item]
    )).values());

    console.log("🟢 Final unique approvals before dispatch:", uniqueApprovals);
      
      dispatch(setApprovals(newApprovals));
    } catch (error) {
      console.error("❌ Error fetching approvals:", error);
      dispatch(setApprovals([]));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectApproval = (approval) => {
    setSelectedApprovals(prev => {
      const isSelected = prev.some(a => a.id === approval.id);
      if (isSelected) {
        return prev.filter(a => a.id !== approval.id);
      } else {
        return [...prev, approval];
      }
    });
  };

  const handleBatchRevoke = async () => {
    if (selectedApprovals.length === 0) {
      console.log("⚠️ No approvals selected for batch revoke");
      return;
    }
    
    console.log("🚨 Revoking selected approvals:", selectedApprovals);
    setIsLoading(true);
    setRevokeResults(null);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();

      const selectedERC20s = selectedApprovals
        .filter((a) => a.type === "ERC-20")
        .map((a) => ({
          contract: a.contract, 
          spender: a.spender
        }));

      const selectedERC721s = selectedApprovals
        .filter((a) => a.type === "ERC-721")
        .map((a) => a.tokenId);

      const selectedERC1155s = selectedApprovals
        .filter((a) => a.type === "ERC-1155")
        .map((a) => a.spender);

      let results = { successful: [], failed: [] };

      if (selectedERC20s.length > 0) {
        console.log("🔥 Batch revoking ERC-20 approvals:", selectedERC20s);
        const erc20Results = await batchRevokeERC20Approvals(selectedERC20s, signer);
        results.successful = [...results.successful, ...erc20Results.successful];
        results.failed = [...results.failed, ...erc20Results.failed];
      }

      if (selectedERC721s.length > 0) {
        console.log("🔥 Batch revoking ERC-721 approvals:", selectedERC721s);
        const erc721Results = await batchRevokeERC721Approvals(wallet, selectedERC721s);
        results.successful = [...results.successful, ...erc721Results.successful];
        results.failed = [...results.failed, ...erc721Results.failed];
      }

      if (selectedERC1155s.length > 0) {
        console.log("🔥 Batch revoking ERC-1155 approvals:", selectedERC1155s);
        const erc1155Results = await batchRevokeERC1155Approvals(selectedERC1155s);
        results.successful = [...results.successful, ...erc1155Results.successful];
        results.failed = [...results.failed, ...erc1155Results.failed];
      }

      console.log("✅ Batch revocation results:", results);
      setRevokeResults({
        success: true,
        successful: results.successful.length,
        failed: results.failed.length,
        details: results
      });
      
      setSelectedApprovals([]);
      fetchApprovals();
    } catch (error) {
      console.error("❌ Error in batch revocation:", error);
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
