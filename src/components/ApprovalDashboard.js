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
  // Ensure approvals is always an array with proper fallback
  const approvals = useSelector((state) => state.web3?.approvals) || [];
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [showMixedBatchRevoke, setShowMixedBatchRevoke] = useState(false);
  // New state for progress tracking
  const [progressValue, setProgressValue] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  useEffect(() => {
    if (wallet) loadApprovals();
  }, [wallet]);

  useEffect(() => {
    console.log("📋 Updated Approvals in UI:", JSON.stringify(approvals, null, 2));
  }, [approvals]);

  const loadApprovals = async () => {
    if (!wallet || isLoading) return;
    setIsLoading(true);
    setMessage({ type: 'info', text: 'Loading approvals...' });
    // Reset progress when starting a new operation
    setProgressValue(0);
    setProgressStatus('Initializing...');

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("Fetching approvals for:", address);
      setProgressValue(10);
      setProgressStatus('Connecting to wallet...');

      let erc20List = [], erc721List = [], erc1155List = [];

      try { 
        setProgressValue(30);
        setProgressStatus('Fetching ERC-20 approvals...');
        erc20List = await getERC20Approvals([CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2], address) || []; 
      } catch (err) { 
        console.error("❌ ERC-20 Fetch Error:", err); 
        erc20List = []; 
      }

      try { 
        setProgressValue(60);
        setProgressStatus('Fetching ERC-721 approvals...');
        erc721List = await getERC721Approvals(address) || []; 
      } catch (err) { 
        console.error("❌ ERC-721 Fetch Error:", err); 
        erc721List = []; 
      }

      try { 
        setProgressValue(80);
        setProgressStatus('Fetching ERC-1155 approvals...');
        erc1155List = await getERC1155Approvals(address) || []; 
      } catch (err) { 
        console.error("❌ ERC-1155 Fetch Error:", err); 
        erc1155List = []; 
      }

      setProgressValue(90);
      setProgressStatus('Processing results...');

      // Spread and map operations
      const allApprovals = [
        ...(Array.isArray(erc20List) ? erc20List.map(a => ({ ...a, type: 'ERC-20' })) : []),
        ...(Array.isArray(erc721List) ? erc721List.map(a => ({ ...a, type: 'ERC-721' })) : []),
        ...(Array.isArray(erc1155List) ? erc1155List.map(a => ({ ...a, type: "ERC-1155" })) : [])
      ];

      console.log("🔹 Final approval list before dispatch:", allApprovals);
      dispatch(setApprovals(allApprovals));

      setProgressValue(100);
      setProgressStatus('Complete!');
      setMessage({ type: 'success', text: `Found ${allApprovals.length} approvals` });
    } catch (error) {
      console.error("❌ Load Error:", error);
      setMessage({ type: 'danger', text: `Error: ${error.message || 'Unknown error'}` });
      // In case of error, set empty array to ensure consistent state
      dispatch(setApprovals([]));
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        // Reset progress after a delay to show the completed progress bar
        setTimeout(() => {
          setProgressValue(0);
          setProgressStatus('');
        }, 1000);
      }, 500);
    }
  };

  const handleSelect = (approval) => {
    setSelectedApprovals(prev => {
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

  const handleRevoke = async () => {
    if (!selectedApprovals.length || processing) return;

    // Identify the selected approval types
    const approvalTypes = [...new Set(selectedApprovals.map(a => a?.type).filter(Boolean))];

    if (approvalTypes.length > 1) {
        console.log("🔄 Switching to MixedBatchRevoke...");
        setShowMixedBatchRevoke(true);
        return; // Prevent execution of regular revoke logic
    }

    // Save selected approvals and reset UI states
    const approvalsToRevoke = [...selectedApprovals];
    setSelectedApprovals([]);
    setProcessing(true);
    setMessage({ type: 'info', text: 'Processing revocation...' });

    // Reset progress
    setProgressValue(0);
    setProgressStatus('Initializing revocation...');

    try {
        setProgressValue(10);
        setProgressStatus('Connecting to wallet...');
        const provider = await getProvider();
        const signer = await provider.getSigner();
        let result = { success: false, error: "Unexpected error" };

        setProgressValue(30);
        setProgressStatus('Preparing transaction...');

        // Handle ERC-20, ERC-721, ERC-1155 separately
        if (approvalsToRevoke.every(a => a?.type === 'ERC-20')) {
            setProgressStatus('Revoking ERC-20 approvals...');
            result = await revokeERC20Approvals(approvalsToRevoke, signer);
        } else if (approvalsToRevoke.every(a => a?.type === 'ERC-721')) {
            setProgressStatus('Revoking ERC-721 approvals...');
            result = await revokeERC721Approvals(approvalsToRevoke, signer);
        } else if (approvalsToRevoke.every(a => a?.type === 'ERC-1155')) {
            setProgressStatus('Revoking ERC-1155 approvals...');
            result = await revokeMultipleERC1155Approvals(
                approvalsToRevoke.map(a => ({ contract: a.contract, spender: a.spender }))
            );
        } else {
            throw new Error("Mixed approval types selected. Please revoke ERC-20, ERC-721, and ERC-1155 separately.");
        }

        setProgressValue(90);
        setProgressStatus('Updating state...');

        if (result?.success) {
            console.log("🗑️ Removing revoked approvals from Redux...");

            dispatch(setApprovals(prevApprovals => {
                if (!Array.isArray(prevApprovals)) return [];
                return prevApprovals.filter(a =>
                    !approvalsToRevoke.some(sel =>
                        sel.contract === a.contract &&
                        sel.spender === a.spender &&
                        (a.tokenId ? sel.tokenId === a.tokenId : true)
                    )
                );
            }));

            setProgressValue(100);
            setProgressStatus('Revocation complete!');
            setMessage({ type: 'success', text: `Revoked ${approvalsToRevoke.length} approval(s)!` });

            setTimeout(loadApprovals, 2000);
        } else {
            throw new Error(result?.error || 'Unknown error during revocation');
        }
    } catch (error) {
        console.error("❌ Revocation Error:", error);
        setProgressValue(0);
        setMessage({ type: 'danger', text: `Error: ${error.message || 'Unknown error'}` });
    } finally {
        setTimeout(() => {
            setProcessing(false);
            setTimeout(() => {
                setProgressValue(0);
                setProgressStatus('');
            }, 1000);
        }, 500);
    }
};


return (
    <div className="card shadow-lg">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Token Approvals</h5>
        <button className="btn btn-light" onClick={loadApprovals} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="card-body">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
        
        {/* Progress Bar - Show when loading or processing */}
        {(isLoading || processing || progressValue > 0) && (
          <TransactionProgressBar 
            progress={progressValue} 
            status={progressStatus}
            variant={isLoading ? "info" : "primary"}
          />
        )}

        {showMixedBatchRevoke ? (
          <MixedBatchRevoke 
            selectedApprovals={selectedApprovals} 
            onComplete={() => {
              setShowMixedBatchRevoke(false);
              setSelectedApprovals([]);  // Clearing selections after revoking
              loadApprovals();
            }} 
          />
        ) : (
          <>
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Select</th>
                  <th>Type</th>
                  <th>Contract</th>
                  <th>Spender</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {/* FIX: Safe length check and mapping */}
                {Array.isArray(approvals) && approvals.length > 0 ? (
                  approvals.map((a, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedApprovals.some(sel =>
                            sel.contract === a.contract &&
                            sel.spender === a.spender &&
                            (a.tokenId ? sel.tokenId === a.tokenId : true)
                          )}
                          onChange={() => handleSelect(a)}
                        />
                      </td>
                      <td>
                        <span className={`badge bg-${a.type === 'ERC-20' ? 'success' : a.type === 'ERC-721' ? 'primary' : 'warning'}`}>
                          {a.type}
                        </span>
                      </td>
                      <td><code>{a.contract?.substring(0, 8)}...</code></td>
                      <td><code>{a.spender?.substring(0, 8)}...</code></td>
              <td>
                {a.type === "ERC-20" &&
                  `Unlimited Allowance ${a.amount === "115792089237316195423570985008687907853269984665640564039457584007913129639935" ? "" : `(${Number(a.amount || 0).toLocaleString()})`}`}
                {a.type === "ERC-721" && (a.tokenId === "all" ? "All Tokens" : `Token ID: ${a.tokenId || "N/A"}`)}
                {a.type === "ERC-1155" && "Collection-wide Approval"}
              </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No active approvals found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* REVOKE BUTTON - Always Visible */}
            {!showMixedBatchRevoke && (
              <button
                className="btn btn-danger w-100 mt-3"
                onClick={handleRevoke}
                disabled={processing || selectedApprovals.length === 0}
              >
                {processing ? 'Revoking...' : `Revoke Selected (${selectedApprovals.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;

