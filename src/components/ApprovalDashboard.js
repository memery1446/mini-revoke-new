import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals, revokeMultipleERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { revokeERC20Approvals, revokeERC721Approvals } from "../utils/batchRevokeUtils";

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals) || [];
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApprovals, setSelectedApprovals] = useState([]);

  useEffect(() => {
    if (wallet) loadApprovals();
  }, [wallet]);

  useEffect(() => {
    console.log("📋 Approvals in UI:", JSON.stringify(approvals, null, 2));
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

      try { erc20List = await getERC20Approvals([], address) || []; }
      catch (err) { console.error("❌ ERC-20 Fetch Error:", err); }

      try { erc721List = await getERC721Approvals(address) || []; }
      catch (err) { console.error("❌ ERC-721 Fetch Error:", err); }

      try { erc1155List = await getERC1155Approvals(address) || []; }
      catch (err) { console.error("❌ ERC-1155 Fetch Error:", err); }

      const allApprovals = [
        ...erc20List.map(a => ({ ...a, type: 'ERC-20' })),
        ...erc721List.map(a => ({ ...a, type: 'ERC-721' })),
        ...erc1155List.map(a => ({ ...a, type: "ERC-1155" }))
      ];

      console.log("🔹 Final approval list before dispatch:", allApprovals);
      dispatch(setApprovals(allApprovals));

      setMessage({ type: 'success', text: `Found ${allApprovals.length} approvals` });
    } catch (error) {
      console.error("❌ Load Error:", error);
      setMessage({ type: 'danger', text: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (approval) => {
    setSelectedApprovals(prev =>
      prev.some(a => a.contract === approval.contract && a.spender === approval.spender)
        ? prev.filter(a => !(a.contract === approval.contract && a.spender === approval.spender))
        : [...prev, approval]
    );
  };

  const handleRevoke = async () => {
    if (!selectedApprovals.length || processing) return;
    setProcessing(true);
    setMessage({ type: 'info', text: 'Processing revocation...' });

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();

      let result;
      if (selectedApprovals.every(a => a.type === 'ERC-20')) {
        result = await revokeERC20Approvals(selectedApprovals, signer);
      } else if (selectedApprovals.every(a => a.type === 'ERC-721')) {
        result = await revokeERC721Approvals(selectedApprovals, signer);
      } else if (selectedApprovals.every(a => a.type === 'ERC-1155')) {
        result = await revokeMultipleERC1155Approvals(
          selectedApprovals.map(a => ({ contract: a.contract, spender: a.spender }))
        );
      } else {
        throw new Error("Mixed approval types selected. Please revoke ERC-20, ERC-721, and ERC-1155 separately.");
      }

if (result.success) {
  dispatch(setApprovals(approvals.filter(a => !selectedApprovals.includes(a))));
  setMessage({ type: 'success', text: `Revoked ${result.count} approval(s)!` });
  setSelectedApprovals([]);
  setTimeout(loadApprovals, 2000);

      } else {
        setMessage({ type: 'danger', text: `Error: ${result.error}` });
      }
    } catch (error) {
      console.error("❌ Revocation Error:", error);
      setMessage({ type: 'danger', text: `Error: ${error.message}` });
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
            {approvals.length > 0 ? (
              approvals.map((a, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedApprovals.some(sel => sel.contract === a.contract && sel.spender === a.spender)}
                      onChange={() => handleSelect(a)}
                    />
                  </td>
                  <td>
                    <span className={`badge bg-${a.type === 'ERC-20' ? 'success' : a.type === 'ERC-721' ? 'primary' : 'warning'}`}>
                      {a.type}
                    </span>
                  </td>
                  <td><code>{a.contract.substring(0, 8)}...</code></td>
                  <td><code>{a.spender.substring(0, 8)}...</code></td>
                  <td>
                    {a.type === "ERC-20" && "Unlimited Allowance"}
                    {a.type === "ERC-721" && (a.tokenId === "all" ? "All Tokens" : `Token ID: ${a.tokenId}`)}
                    {a.type === "ERC-1155" && `Collection-wide Approval`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">No active approvals</td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          className="btn btn-danger w-100 mt-3"
          onClick={handleRevoke}
          disabled={processing || selectedApprovals.length === 0}
        >
          {processing ? 'Revoking...' : `Revoke Selected (${selectedApprovals.length})`}
        </button>
      </div>
    </div>
  );
};

export default ApprovalDashboard;


