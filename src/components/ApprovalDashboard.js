import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals, revokeMultipleERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
// IMPORTANT: Switch to providerService to match ExistingApprovals.js
import { getProvider } from "../utils/providerService";
import { revokeERC20Approvals, revokeERC721Approvals } from "../utils/batchRevokeUtils";
import { CONTRACT_ADDRESSES } from "../constants/abis"; 
import MixedBatchRevoke from "../components/MixedBatchRevoke";
import TransactionProgressBar from "../components/TransactionProgressBar";

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3?.account);
  // Guarantee approvals is always an array and log its value
  const approvals = useSelector((state) => {
    const approvalsFromState = state.web3?.approvals;
    console.log("🔍 Reading approvals from Redux:", approvalsFromState);
    return Array.isArray(approvalsFromState) ? approvalsFromState : [];
  });
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("📋 UI: Approvals Updated:", approvals);
    console.log("📊 Total approvals in dashboard:", approvals.length);
  }, [approvals]);

  // ✅ Allow selection of individual approvals
  const handleSelect = (approval) => {
    console.log("🔘 Selecting approval:", approval);
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
  // Somewhere near the top of your ApprovalDashboard component, add this:
useEffect(() => {
  if (approvals && approvals.length > 0) {
    console.log("TRYING TO FORCE RENDER APPROVALS:", 
                JSON.stringify(approvals, null, 2));
    
    // Force a re-render by dispatching the same data again
    const timer = setTimeout(() => {
      dispatch(setApprovals([...approvals]));
    }, 500);
    
    return () => clearTimeout(timer);
  }
}, [approvals]);

  // NEW: Add a function to handle single approval revokes
  const handleSingleRevoke = (approval) => {
    console.log("🔴 Revoking single approval:", approval);
    // Set the selected approval and then call the main revoke function
    setSelectedApprovals([approval]);
    // We need to use setTimeout because setState is asynchronous
    setTimeout(() => handleRevoke(), 0);
  };

  // ✅ Fix revocation to process selected approvals
  const handleRevoke = async () => {
    if (!selectedApprovals.length || processing) {
      console.log("⚠️ No approvals selected or already processing");
      return;
    }

    console.log("🚀 Starting revocation for", selectedApprovals.length, "approvals");
    setProcessing(true);
    setProgressValue(10);
    setProgressStatus('Preparing revocation...');
    setError(null);

    try {
      console.log("🔌 Getting provider and signer...");
      const provider = await getProvider();
      if (!provider) {
        throw new Error("Failed to get provider");
      }
      
      const signer = await provider.getSigner();
      if (!signer) {
        throw new Error("Failed to get signer");
      }
      
      console.log("✅ Provider and signer ready");
      let result = { success: false };

      // Check what type of approvals we're revoking
      console.log("🧪 Checking approval types...");
      if (selectedApprovals.every(a => a?.type === 'ERC-20')) {
        console.log("💰 Revoking ERC-20 approvals");
        setProgressStatus('Revoking ERC-20 approvals...');
        result = await revokeERC20Approvals(selectedApprovals, signer);
      } else if (selectedApprovals.every(a => a?.type === 'ERC-721')) {
        console.log("🖼️ Revoking ERC-721 approvals");
        setProgressStatus('Revoking ERC-721 approvals...');
        result = await revokeERC721Approvals(selectedApprovals, signer);
      } else if (selectedApprovals.every(a => a?.type === 'ERC-1155')) {
        console.log("🎮 Revoking ERC-1155 approvals");
        setProgressStatus('Revoking ERC-1155 approvals...');
        result = await revokeMultipleERC1155Approvals(
          selectedApprovals.map(a => ({ contract: a.contract, spender: a.spender }))
        );
      } else {
        console.log("❌ Mixed approval types");
        throw new Error("Mixed approval types selected. Please revoke ERC-20, ERC-721, and ERC-1155 separately.");
      }

      setProgressValue(90);
      setProgressStatus('Updating state...');
      console.log("🔄 Revocation result:", result);

      if (result?.success) {
        // Create a new array without the revoked approvals instead of using a function
        const currentApprovals = [...approvals]; // Make a copy of current approvals
        const remainingApprovals = currentApprovals.filter(a =>
          !selectedApprovals.some(sel =>
            sel.contract === a.contract &&
            sel.spender === a.spender &&
            (a.tokenId ? sel.tokenId === a.tokenId : true)
          )
        );
        
        console.log("🟢 Updating Redux with remaining approvals:", remainingApprovals.length);
        dispatch(setApprovals(remainingApprovals));
        setProgressValue(100);
        setProgressStatus('Revocation complete!');
      } else {
        throw new Error(result?.error || 'Unknown error during revocation');
      }
    } catch (error) {
      console.error("❌ Revocation Error:", error);
      setProgressStatus('Revocation failed.');
      setError(error.message || "Revocation failed");
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
  <div>
    <button 
      className="btn btn-info btn-sm me-2" 
      onClick={() => console.log("Current Redux approvals:", approvals)}
    >
      Debug
    </button>
    <button 
      className="btn btn-secondary" 
      onClick={() => {
        console.log("Manual refresh without page reload");
        // Just force a re-render by updating state
        dispatch(setApprovals([...approvals]));
      }}
    >
      🔄 Refresh
    </button>
  </div>
</div>

      <div className="card-body">
        {/* Connection Status */}
        <div className="mb-3">
          <strong>Account:</strong> {wallet ? `${wallet.substring(0,6)}...${wallet.substring(wallet.length-4)}` : 'Not connected'}
          <div><strong>Approvals Found:</strong> {approvals.length}</div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger mb-3">{error}</div>
        )}

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
                      disabled={processing}
                    />
                  </td>
                  <td>{a.asset || a.contract.substring(0, 8)}</td>
                  <td>
                    <span className={`badge bg-${a.type === "ERC-20" ? "success" : a.type === "ERC-721" ? "primary" : "warning"}`}>
                      {a.type || 'Unknown'}
                    </span>
                  </td>
                  <td>{a.valueAtRisk || 'Unknown'}</td>
                  <td>
                    {/* Fix the individual revoke button to use handleSingleRevoke */}
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleSingleRevoke(a)}
                      disabled={processing}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="alert alert-warning">
            <p className="mb-0">No active approvals found in Redux store.</p>
            <small>If you've connected your wallet, try refreshing or check console logs for errors.</small>
          </div>
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

