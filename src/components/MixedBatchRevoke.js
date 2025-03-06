import React, { useState } from "react";
import { revokeERC20Approvals, revokeERC721Approvals } from "../utils/batchRevokeUtils";
import { revokeMultipleERC1155Approvals } from "../utils/erc1155Approvals";
import { useDispatch } from "react-redux";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";

const MixedBatchRevoke = ({ selectedApprovals = [], onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleMixedRevoke = async () => {
    if (!selectedApprovals || !selectedApprovals.length || processing) return;
    setProcessing(true);
    setError(null);

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();

      let revokedApprovals = [];

      // ✅ Process each type separately
      const erc20Approvals = selectedApprovals.filter(a => a.type === "ERC-20");
      const erc721Approvals = selectedApprovals.filter(a => a.type === "ERC-721");
      const erc1155Approvals = selectedApprovals.filter(a => a.type === "ERC-1155");

      console.log("🔄 Mixed Batch Revoke Starting...");
      console.log("💰 ERC-20 Approvals to Revoke:", erc20Approvals);
      console.log("🖼️ ERC-721 Approvals to Revoke:", erc721Approvals);
      console.log("🎮 ERC-1155 Approvals to Revoke:", erc1155Approvals);

      if (erc20Approvals.length) {
        try {
          const result = await revokeERC20Approvals(erc20Approvals, signer);
          if (result && result.success) revokedApprovals.push(...erc20Approvals);
        } catch (err) {
          console.error("❌ ERC-20 Revoke Error:", err.message);
        }
      }

      if (erc721Approvals.length) {
        try {
          const result = await revokeERC721Approvals(erc721Approvals, signer);
          if (result && result.success) revokedApprovals.push(...erc721Approvals);
        } catch (err) {
          console.error("❌ ERC-721 Revoke Error:", err.message);
        }
      }

      if (erc1155Approvals.length) {
        try {
          const result = await revokeMultipleERC1155Approvals(
            erc1155Approvals.map(a => ({ contract: a.contract, spender: a.spender }))
          );
          if (result && result.success) revokedApprovals.push(...erc1155Approvals);
        } catch (err) {
          console.error("❌ ERC-1155 Revoke Error:", err.message);
        }
      }

      console.log("✅ Mixed Batch Revoke Completed! Revoked Approvals:", revokedApprovals);

      // ✅ Remove revoked approvals from Redux
      if (revokedApprovals.length) {
dispatch(setApprovals(prevApprovals =>
  prevApprovals.filter(a =>
    !selectedApprovals.some(sel => 
      sel.contract === a.contract && 
      sel.spender === a.spender && 
      (a.tokenId ? sel.tokenId === a.tokenId : true)
    )
  )
));
      }

      // ✅ Refresh the dashboard
      if (typeof onComplete === 'function') {
        onComplete();
      }
    } catch (error) {
      console.error("❌ Mixed Batch Revoke Failed:", error);
      setError(error.message || "Failed to revoke approvals");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border rounded p-3 mb-3">
      <div className="alert alert-warning">
        <p>⚠️ You are revoking approvals across multiple token types:</p>
        <ul>
          <li>ERC-20: {selectedApprovals.filter(a => a.type === "ERC-20").length}</li>
          <li>ERC-721: {selectedApprovals.filter(a => a.type === "ERC-721").length}</li>
          <li>ERC-1155: {selectedApprovals.filter(a => a.type === "ERC-1155").length}</li>
        </ul>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          <p>Error: {error}</p>
        </div>
      )}
      
      <button 
        className="btn btn-danger w-100" 
        onClick={handleMixedRevoke} 
        disabled={processing || !selectedApprovals.length}
      >
        {processing ? "Processing..." : "Confirm Mixed Batch Revoke"}
      </button>
    </div>
  );
};

export default MixedBatchRevoke;

