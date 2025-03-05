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
  const approvals = useSelector((state) => state.web3.approvals); // ✅ Use Redux approvals directly
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApprovals, setSelectedApprovals] = useState([]); // ✅ Supports multiple selection

  useEffect(() => {
    if (wallet) loadApprovals();
  }, [wallet]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    console.log("🔄 ApprovalDashboard re-rendering, approvals:", approvals);
  }, [approvals]); // ✅ Force re-render when approvals update

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

      dispatch(setApprovals(allApprovals)); // ✅ Ensure Redux is updated
      setMessage({ type: 'success', text: `Found ${allApprovals.length} approvals` });
    } catch (error) {
      console.error("❌ Load Error:", error);
      setMessage({ type: 'danger', text: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectApproval = (approval) => {
    setSelectedApprovals((prev) => {
      const exists = prev.some(a => a.id === approval.id);
      return exists ? prev.filter(a => a.id !== approval.id) : [...prev, approval];
    });
  };

  const handleRevoke = async () => {
    if (!selectedApprovals.length || processing) return;
    setProcessing(true);
    setMessage({ type: 'info', text: 'Processing revocation...' });

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();

      let result;
      const approvalsToRevoke = selectedApprovals;

      if (approvalsToRevoke.every(a => a.type === 'ERC-20')) {
        result = await revokeERC20Approvals(approvalsToRevoke, signer);
      } else if (approvalsToRevoke.every(a => a.type === 'ERC-721')) {
        result = await revokeERC721Approvals(approvalsToRevoke, signer);
      } else if (approvalsToRevoke.every(a => a.type === 'ERC-1155')) {
        result = await revokeMultipleERC1155Approvals(
          approvalsToRevoke.map(a => ({ contract: a.contract, spender: a.spender }))
        );
      } else {
        throw new Error("Mixed approval types selected. Please revoke ERC-20, ERC-721, and ERC-1155 separately.");
      }

      if (result.success) {
        dispatch(setApprovals(approvals.filter(a => !approvalsToRevoke.includes(a))));
        setMessage({ type: 'success', text: `Revoked ${result.count} approval(s)!` });
        setTimeout(loadApprovals, 3000);
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
    <div className="card">
      <div className="card-header">
        <h5>Token Approvals</h5>
        <button className="btn btn-danger" onClick={handleRevoke} disabled={processing || selectedApprovals.length === 0}>
          {processing ? 'Revoking...' : `Revoke Selected (${selectedApprovals.length})`}
        </button>
      </div>
    </div>
  );
};

export default ApprovalDashboard;
