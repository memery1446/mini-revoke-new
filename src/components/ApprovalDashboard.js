import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals, revokeERC1155Approval, revokeMultipleERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { Contract, ZeroAddress, getAddress } from 'ethers';
import { ERC20_ABI, NFT_ABI, CONTRACT_ADDRESSES } from "../constants/abis";
import { revokeERC20Approvals, revokeERC721Approvals } from "../utils/batchRevokeUtils"; 

// ✅ Ensure all contract addresses are checksummed
const tokenContracts = [getAddress(CONTRACT_ADDRESSES.TK1), getAddress(CONTRACT_ADDRESSES.TK2)];
const NFT_CONTRACT = getAddress(CONTRACT_ADDRESSES.TestNFT);
const NFT_SPENDER = getAddress(CONTRACT_ADDRESSES.MockSpender);
const ERC1155_CONTRACT = getAddress(CONTRACT_ADDRESSES.ERC1155);
const ERC1155_SPENDER = getAddress(CONTRACT_ADDRESSES.MockSpender);

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const reduxApprovals = useSelector((state) => state.web3.approvals);
  const [approvals, setLocalApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);

  // 🔹 Load approvals when wallet connects
  useEffect(() => { if (wallet) loadApprovals(); }, [wallet]);

  // 🔹 Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 🔹 Load approvals dynamically
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

      try { erc20List = await getERC20Approvals(tokenContracts, address) || []; }
      catch (err) { console.error("❌ ERC-20 Fetch Error:", err); }

      try { erc721List = await getERC721Approvals(address) || []; }
      catch (err) { console.error("❌ ERC-721 Fetch Error:", err); }

      try { erc1155List = await getERC1155Approvals(address) || []; }
      catch (err) { console.error("❌ ERC-1155 Fetch Error:", err); }

      const allApprovals = [
        ...reduxApprovals.filter(a => a.type !== "ERC-1155"),
        ...erc20List.map(a => ({ ...a, type: 'ERC-20', id: `erc20-${a.contract}-${a.spender}` })),
        ...erc721List.map(a => ({ ...a, type: 'ERC-721', id: `erc721-${a.contract}-${a.spender}-${a.tokenId || 'all'}` })),
        ...erc1155List.map(a => ({ ...a, type: "ERC-1155", id: `erc1155-${a.contract}-${a.spender}`, tokenId: a.tokenId || "all" })),
      ];

      dispatch(setApprovals(allApprovals));
      setMessage({ type: 'success', text: `Found ${allApprovals.length} approvals` });
    } catch (error) {
      console.error("❌ Load Error:", error);
      setMessage({ type: 'danger', text: `Error: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Handle approval selection
  const handleSelect = (approval) => setSelectedApproval(selectedApproval?.id === approval.id ? null : approval);

  // 🔹 Unified Revoke Function (ERC-20, ERC-721, ERC-1155)
const handleRevoke = async () => {
  if (!selectedApproval || processing) return;

  setProcessing(true);
  setMessage({ type: 'info', text: 'Processing revocation...' });

  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const approvalsToRevoke = approvals.filter(a => a.selected);

    let result;
    if (approvalsToRevoke.every(a => a.type === 'ERC-20')) {
      result = await revokeERC20Approvals(approvalsToRevoke, signer);
    } else if (approvalsToRevoke.every(a => a.type === 'ERC-721')) {
      result = await revokeERC721Approvals(approvalsToRevoke, signer);
    } else if (approvalsToRevoke.every(a => a.type === 'ERC-1155')) {
      // ✅ Ensure ERC-1155 approvals pass contract & spender
result = await revokeMultipleERC1155Approvals(
  approvalsToRevoke.map(a => ({ contract: a.contract, spender: a.spender }))
);

    } else {
      throw new Error("Mixed approval types selected. Please revoke ERC-20, ERC-721, and ERC-1155 separately.");
    }

    if (result.success) {
      // ✅ Update Redux to remove revoked approvals from UI instantly
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
        <button className="btn btn-outline-primary" onClick={loadApprovals} disabled={isLoading || processing}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div className="card-body">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
        <table className="table">
          <thead><tr><th>Type</th><th>Contract</th><th>Spender</th><th>Details</th><th>Action</th></tr></thead>
          <tbody>
            {approvals.length > 0 ? approvals.map(approval => (
              <tr key={approval.id} className={selectedApproval?.id === approval.id ? 'table-primary' : ''}>
                <td>{approval.type}</td>
                <td>{approval.contract.substring(0, 8)}...</td>
                <td>{approval.spender.substring(0, 8)}...</td>
                <td>{approval.tokenId ? `Token #${approval.tokenId}` : 'Unlimited'}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleSelect(approval)}>Select</button>
                </td>
              </tr>
            )) : <tr><td colSpan="5">No approvals found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApprovalDashboard;
