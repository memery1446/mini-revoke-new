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


const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3?.account);
  // ✅ FIX: Ensure approvals is always an array with proper fallback
  const approvals = useSelector((state) => state.web3?.approvals) || [];
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [showMixedBatchRevoke, setShowMixedBatchRevoke] = useState(false);

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

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("Fetching approvals for:", address);

      let erc20List = [], erc721List = [], erc1155List = [];

      try { 
        erc20List = await getERC20Approvals([CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2], address) || []; 
      } catch (err) { 
        console.error("❌ ERC-20 Fetch Error:", err); 
        erc20List = []; // ✅ FIX: Ensure it's an array on error
      }

      try { 
        erc721List = await getERC721Approvals(address) || []; 
      } catch (err) { 
        console.error("❌ ERC-721 Fetch Error:", err); 
        erc721List = []; // ✅ FIX: Ensure it's an array on error
      }

      try { 
        erc1155List = await getERC1155Approvals(address) || []; 
      } catch (err) { 
        console.error("❌ ERC-1155 Fetch Error:", err); 
        erc1155List = []; // ✅ FIX: Ensure it's an array on error
      }

      // ✅ FIX: Safe spread and map operations
      const allApprovals = [
        ...(Array.isArray(erc20List) ? erc20List.map(a => ({ ...a, type: 'ERC-20' })) : []),
        ...(Array.isArray(erc721List) ? erc721List.map(a => ({ ...a, type: 'ERC-721' })) : []),
        ...(Array.isArray(erc1155List) ? erc1155List.map(a => ({ ...a, type: "ERC-1155" })) : [])
      ];

      console.log("🔹 Final approval list before dispatch:", allApprovals);
      dispatch(setApprovals(allApprovals));

      setMessage({ type: 'success', text: `Found ${allApprovals.length} approvals` });
    } catch (error) {
      console.error("❌ Load Error:", error);
      setMessage({ type: 'danger', text: `Error: ${error.message || 'Unknown error'}` });
      // ✅ FIX: In case of error, set empty array to ensure consistent state
      dispatch(setApprovals([]));
    } finally {
      setIsLoading(false);
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

    // ✅ FIX: Safe access to types array
    const approvalTypes = Array.isArray(selectedApprovals) 
      ? [...new Set(selectedApprovals.map(a => a?.type).filter(Boolean))]
      : [];
      
    if (approvalTypes.length > 1) {
       console.log("🔄 Switching to MixedBatchRevoke...");
      setShowMixedBatchRevoke(true);
      return; // This prevents execution of regular revoke logic
    }

    // Save a copy for revocation
    const approvalsToRevoke = [...selectedApprovals];
    setSelectedApprovals([]);
    setProcessing(true);
    setMessage({ type: 'info', text: 'Processing revocation...' });

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      let result;

      // ✅ FIX: Safer checks
      if (approvalsToRevoke.every(a => a?.type === 'ERC-20')) {
        result = await revokeERC20Approvals(approvalsToRevoke, signer);
      } else if (approvalsToRevoke.every(a => a?.type === 'ERC-721')) {
        result = await revokeERC721Approvals(approvalsToRevoke, signer);
      } else if (approvalsToRevoke.every(a => a?.type === 'ERC-1155')) {
        result = await revokeMultipleERC1155Approvals(
          approvalsToRevoke.map(a => ({ contract: a.contract, spender: a.spender }))
        );
      } else {
        throw new Error("Mixed approval types selected. Please revoke ERC-20, ERC-721, and ERC-1155 separately.");
      }

      if (result?.success) {
        console.log("🗑️ Removing revoked approvals from Redux...");
        
        // ✅ FIX: Safe update with careful null checking
        dispatch(setApprovals(prevApprovals => {
          if (!Array.isArray(prevApprovals)) return [];
          
          return prevApprovals.filter(a => {
            if (!a) return false;
            
            return !approvalsToRevoke.some(sel => 
              sel.contract === a.contract && 
              sel.spender === a.spender && 
              (a.tokenId ? sel.tokenId === a.tokenId : true)
            );
          });
        }));

        setMessage({ type: 'success', text: `Revoked ${result.count || 0} approval(s)!` });
        setTimeout(loadApprovals, 2000);
      } else {
        setMessage({ type: 'danger', text: `Error: ${result?.error || 'Unknown error during revocation'}` });
      }
    } catch (error) {
      console.error("❌ Revocation Error:", error);
      setMessage({ type: 'danger', text: `Error: ${error?.message || 'Unknown error'}` });
    } finally {
      setProcessing(false);
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

        {showMixedBatchRevoke ? (
          <MixedBatchRevoke 
            selectedApprovals={selectedApprovals} 
            onComplete={() => {
              setShowMixedBatchRevoke(false);
              setSelectedApprovals([]);  // ✅ Clear selections after revoking
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
                {/* ✅ FIX: Safe length check and mapping */}
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
                        {a.type === "ERC-20" && `Unlimited Allowance (${a.amount || 0})`}
                        {a.type === "ERC-721" && (a.tokenId === "all" ? "All Tokens" : `Token ID: ${a.tokenId || 'N/A'}`)}
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

