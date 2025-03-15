import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals, revokeMultipleERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { revokeERC20Approvals, revokeERC721Approvals } from "../utils/batchRevokeUtils";
import { CONTRACT_ADDRESSES } from "../constants/abis"; 
import MixedBatchRevoke from "../components/MixedBatchRevoke";
import TransactionProgressBar from "../components/TransactionProgressBar";

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3?.account);
  const approvals = useSelector((state) => state.web3?.approvals) || [];
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  useEffect(() => {
    console.log("📋 UI: Approvals Updated:", approvals);
  }, [approvals]);

  // ✅ Allow selection of individual approvals
  const handleSelect = (approval) => {
    setSelectedApprovals((prev) => {
      const exists = prev.some(a =>
        a.contract === approval.contract &&
        a.spender === approval.spender &&
        (a.tokenId ? a.tokenId === approval.tokenId : true)
      );
      return exists
        ? prev.filter(a =>
            !(a.contract === approval.contract &&
              a.spender === approval.spender &&
              (a.tokenId ? a.tokenId === approval.tokenId : true))
          )
        : [...prev, approval];
    });
  };

  // ✅ Fix revocation to process selected approvals
  const handleRevoke = async () => {
    if (!selectedApprovals.length || processing) return;

    setProcessing(true);
    setProgressValue(10);
    setProgressStatus('Preparing revocation...');

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      let result = { success: false };

      if (selectedApprovals.every(a => a?.type === 'ERC-20')) {
        result = await revokeERC20Approvals(selectedApprovals, signer);
      } else if (selectedApprovals.every(a => a?.type === 'ERC-721')) {
        result = await revokeERC721Approvals(selectedApprovals, signer);
      } else if (selectedApprovals.every(a => a?.type === 'ERC-1155')) {
        result = await revokeMultipleERC1155Approvals(
          selectedApprovals.map(a => ({ contract: a.contract, spender: a.spender }))
        );
      } else {
        throw new Error("Mixed approval types selected. Please revoke ERC-20, ERC-721, and ERC-1155 separately.");
      }

      setProgressValue(90);
      setProgressStatus('Updating state...');

      if (result?.success) {
        dispatch(setApprovals(prev => prev.filter(a =>
          !selectedApprovals.some(sel =>
            sel.contract === a.contract &&
            sel.spender === a.spender &&
            (a.tokenId ? sel.tokenId === a.tokenId : true)
          )
        )));
        setProgressValue(100);
        setProgressStatus('Revocation complete!');
      } else {
        throw new Error(result?.error || 'Unknown error during revocation');
      }
    } catch (error) {
      console.error("❌ Revocation Error:", error);
      setProgressStatus('Revocation failed.');
    } finally {
      setProcessing(false);
      setSelectedApprovals([]); 
      setTimeout(() => {
        setProgressValue(0);
        setProgressStatus('');
      }, 1000);
    }
  };

  return (
    <div className="card shadow-lg">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Token Approvals</h5>
        {/* 🔄 REFRESH BUTTON RESTORED */}
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      <div className="card-body">
        {/* Progress Bar */}
        {progressValue > 0 && <TransactionProgressBar progress={progressValue} status={progressStatus} />}

        {approvals && approvals.length > 0 ? (
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>Select</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Value at Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedApprovals.some(sel => 
                        sel.contract === a.contract && 
                        sel.spender === a.spender &&
                        (a.tokenId !== undefined ? sel.tokenId === a.tokenId : true)
                      )}
                      onChange={() => handleSelect(a)}
                    />
                  </td>
                  <td>{a.asset || a.contract.substring(0, 8)}</td>
                  <td>
                    <span className={`badge bg-${a.type === "ERC-20" ? "success" : a.type === "ERC-721" ? "primary" : "warning"}`}>
                      {a.type}
                    </span>
                  </td>
                  <td>{a.valueAtRisk}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRevoke([a])}>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted text-center">No active approvals found. Check Redux logs.</p>
        )}

        {/* REVOKE SELECTED BUTTON */}
        <button
          className="btn btn-danger w-100 mt-3"
          onClick={handleRevoke}
          disabled={processing || selectedApprovals.length === 0}
        >
          {processing ? "Revoking..." : `Revoke Selected (${selectedApprovals.length})`}
        </button>
      </div>
    </div>
  );

};

export default ApprovalDashboard;
