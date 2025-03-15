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

  // Selection of individual approvals
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

  // Handle single approval revokes
  const handleSingleRevoke = (approval) => {
    console.log("🔴 Revoking single approval:", approval);
    // Set the selected approval and then call the main revoke function
    setSelectedApprovals([approval]);
    // We need to use setTimeout because setState is asynchronous
    setTimeout(() => handleRevoke(), 0);
  };

  // Process selected approvals
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
    
    // Separate approvals by type
    const erc20Approvals = selectedApprovals.filter(a => a?.type === 'ERC-20');
    const erc721Approvals = selectedApprovals.filter(a => a?.type === 'ERC-721');
    const erc1155Approvals = selectedApprovals.filter(a => a?.type === 'ERC-1155');
    
    console.log("📊 Approval breakdown:", {
      'ERC-20': erc20Approvals.length,
      'ERC-721': erc721Approvals.length,
      'ERC-1155': erc1155Approvals.length
    });
    
    let successfulApprovals = [];
    
    // Process ERC-20 
    if (erc20Approvals.length > 0) {
      console.log("💰 Revoking ERC-20 approvals");
      setProgressStatus('Revoking ERC-20 approvals...');
      setProgressValue(20);
      try {
        const erc20Result = await revokeERC20Approvals(erc20Approvals, signer);
        if (erc20Result?.success) {
          console.log("✅ ERC-20 revocation successful");
          successfulApprovals.push(...erc20Approvals);
        }
      } catch (error) {
        console.error("❌ ERC-20 revocation error:", error);
      }
    }
    
    // Process ERC-721 
    if (erc721Approvals.length > 0) {
      console.log("🖼️ Revoking ERC-721 approvals");
      setProgressStatus('Revoking ERC-721 approvals...');
      setProgressValue(40);
      try {
        const erc721Result = await revokeERC721Approvals(erc721Approvals, signer);
        if (erc721Result?.success) {
          console.log("✅ ERC-721 revocation successful");
          successfulApprovals.push(...erc721Approvals);
        }
      } catch (error) {
        console.error("❌ ERC-721 revocation error:", error);
      }
    }
    
    // Process ERC-1155 
    if (erc1155Approvals.length > 0) {
      console.log("🎮 Revoking ERC-1155 approvals");
      setProgressStatus('Revoking ERC-1155 approvals...');
      setProgressValue(60);
      try {
        const erc1155Result = await revokeMultipleERC1155Approvals(
          erc1155Approvals.map(a => ({ contract: a.contract, spender: a.spender }))
        );
        if (erc1155Result?.success) {
          console.log("✅ ERC-1155 revocation successful");
          successfulApprovals.push(...erc1155Approvals);
        }
      } catch (error) {
        console.error("❌ ERC-1155 revocation error:", error);
      }
    }
    setProgressValue(80);
    setProgressStatus('Updating state...');
    
    if (successfulApprovals.length > 0) {
      // Create a new array without the revoked approvals
      const currentApprovals = [...approvals]; // Make a copy of current approvals
      const remainingApprovals = currentApprovals.filter(a =>
        !successfulApprovals.some(sel =>
          sel.contract === a.contract &&
          sel.spender === a.spender &&
          (a.tokenId ? sel.tokenId === a.tokenId : true)
        )
      );
      console.log("🟢 Updating Redux with remaining approvals:", remainingApprovals.length);
      dispatch(setApprovals(remainingApprovals));
      setProgressValue(100);
      setProgressStatus(`Revocation complete! Revoked ${successfulApprovals.length} approvals.`);
    } else {
      throw new Error('No approvals were successfully revoked.');
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
    }, 2000);
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
      onClick={async () => {
        console.log("Fetching fresh approval data");
        try {
          const provider = await getProvider();
          if (!provider) {
            throw new Error("Failed to get provider");
          }
          
          // Fetch all types of approvals
          // Fix: Pass empty array as first parameter to getERC20Approvals
          const erc20Approvals = await getERC20Approvals([], wallet, provider);
          const erc721Approvals = await getERC721Approvals(wallet, provider);
          const erc1155Approvals = await getERC1155Approvals(wallet, provider);
          
          // Combine all approvals
          const allApprovals = [
            ...erc20Approvals, 
            ...erc721Approvals, 
            ...erc1155Approvals
          ];
          
          dispatch(setApprovals(allApprovals));
        } catch (error) {
          console.error("Error refreshing approvals:", error);
          setError("Failed to refresh approvals: " + error.message);
        }
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

