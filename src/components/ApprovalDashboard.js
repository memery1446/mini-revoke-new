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
  const approvals = useSelector((state) => state.web3.approvals); 
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApprovals, setSelectedApprovals] = useState([]);

  useEffect(() => {
    if (wallet) {
      console.log("🔄 Wallet detected, loading approvals...");
      loadApprovals();
    }
  }, [wallet]);

  useEffect(() => {
    console.log("🔄 ApprovalDashboard re-rendering with approvals:", approvals);
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

  return (
    <div className="card">
      <div className="card-header">
        <h5>Token Approvals</h5>
        <button className="btn btn-danger" onClick={loadApprovals} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh Approvals'}
        </button>
      </div>
      <div className="card-body">
        {message && <p className={`alert alert-${message.type}`}>{message.text}</p>}
        <ul>
          {approvals.length > 0 ? approvals.map((a, idx) => (
            <li key={idx}>{a.type} - {a.contract} → {a.spender}</li>
          )) : <p>No approvals found.</p>}
        </ul>
      </div>
    </div>
  );
};

export default ApprovalDashboard;

