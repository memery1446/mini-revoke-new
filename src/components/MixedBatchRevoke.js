import React, { useState } from "react";
import { revokeERC20Approvals, revokeERC721Approvals } from "../utils/batchRevokeUtils";
import { revokeMultipleERC1155Approvals } from "../utils/erc1155Approvals";
import { useDispatch } from "react-redux";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";

const MixedBatchRevoke = ({ selectedApprovals, onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const dispatch = useDispatch();

  const handleMixedRevoke = async () => {
    if (!selectedApprovals.length || processing) return;
    setProcessing(true);

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();

      let revokedApprovals = [];

      // ✅ Process each type separately
      const erc20Approvals = selectedApprovals.filter(a => a.type === "ERC-20");
      const erc721Approvals = selectedApprovals.filter(a => a.type === "ERC-721");
      const erc1155Approvals = selectedApprovals.filter(a => a.type === "ERC-1155");

      if (erc20Approvals.length) {
        const result = await revokeERC20Approvals(erc20Approvals, signer);
        if (result.success) revokedApprovals.push(...erc20Approvals);
      }

      if (erc721Approvals.length) {
        const result = await revokeERC721Approvals(erc721Approvals, signer);
        if (result.success) revokedApprovals.push(...erc721Approvals);
      }

      if (erc1155Approvals.length) {
        const result = await revokeMultipleERC1155Approvals(
          erc1155Approvals.map(a => ({ contract: a.contract, spender: a.spender }))
        );
        if (result.success) revokedApprovals.push(...erc1155Approvals);
      }

      // ✅ Remove revoked approvals from Redux
      dispatch(setApprovals(prevApprovals => prevApprovals.filter(a => !revokedApprovals.includes(a))));

      // ✅ Refresh the dashboard
      onComplete();
    } catch (error) {
      console.error("❌ Mixed Batch Revoke Failed:", error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="alert alert-warning">
      <p>⚠️ You are revoking approvals across multiple token types.</p>
      <button className="btn btn-danger w-100" onClick={handleMixedRevoke} disabled={processing}>
        {processing ? "Processing..." : "Confirm Mixed Batch Revoke"}
      </button>
    </div>
  );
};

export default MixedBatchRevoke;

