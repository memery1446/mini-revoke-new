// BatchRevoke.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { revokeERC20Approvals, revokeERC721Approvals, revokeERC1155Approvals } from "../utils/batchRevokeUtils";
import { getProvider } from '../utils/provider';
import { setApprovals } from "../store/web3Slice";
import { getERC20Approvals } from '../utils/erc20Approvals';
import { getERC721Approvals } from '../utils/nftApprovals';
import { getERC1155Approvals } from '../utils/erc1155Approvals';

const BatchRevoke = () => {
  const dispatch = useDispatch();
  // ✅ FIX: Ensure approvals is always an array with proper fallback
  const approvals = useSelector((state) => state.web3?.approvals || []);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isRevoking, setIsRevoking] = useState(false);
  const [results, setResults] = useState(null);

  // ✅ FIX: Safe array filtering with checks
  const erc20Approvals = Array.isArray(approvals) ? approvals.filter(a => a?.type === 'ERC-20') : [];
  const erc721Approvals = Array.isArray(approvals) ? approvals.filter(a => a?.type === 'ERC-721') : [];
  const erc1155Approvals = Array.isArray(approvals) ? approvals.filter(a => a?.type === 'ERC-1155') : [];

  const handleSelectApproval = (approval) => {
    setSelectedApprovals(prev => {
      const exists = prev.some(a => a.contract === approval.contract && a.spender === approval.spender);
      return exists ? prev.filter(a => a.contract !== approval.contract || a.spender !== approval.spender) : [...prev, approval];
    });
  };

  const refreshApprovals = async () => {
    if (isRevoking) return;
    setIsRevoking(true);

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("🔄 Refreshing approvals for:", address);
      const erc20Fetched = await getERC20Approvals([], address) || [];
      const erc721Fetched = await getERC721Approvals(address) || [];
      const erc1155Fetched = await getERC1155Approvals(address) || [];

      console.log("📜 Fetched ERC-20 Approvals:", erc20Fetched);
      console.log("🎨 Fetched ERC-721 Approvals:", erc721Fetched);
      console.log("🛠️ Fetched ERC-1155 Approvals:", erc1155Fetched);

      // ✅ FIX: Safely create the array for dispatch
      const allApprovals = [
        ...(Array.isArray(erc20Fetched) ? erc20Fetched.map(a => ({ ...a, type: 'ERC-20' })) : []),
        ...(Array.isArray(erc721Fetched) ? erc721Fetched.map(a => ({ ...a, type: 'ERC-721' })) : []),
        ...(Array.isArray(erc1155Fetched) ? erc1155Fetched.map(a => ({ ...a, type: 'ERC-1155' })) : [])
      ];
      
      dispatch(setApprovals(allApprovals));
    } catch (error) {
      console.error("❌ Error refreshing approvals:", error);
    } finally {
      setIsRevoking(false);
    }
  };

  const executeBatchRevoke = async () => {
    setIsRevoking(true);
    setResults(null);

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      console.log("🔄 Starting batch revocation with signer:", await signer.getAddress());

      // ✅ FIX: Safe filtering
      const erc20Selected = Array.isArray(selectedApprovals) ? selectedApprovals.filter(a => a?.type === 'ERC-20') : [];
      const erc721Selected = Array.isArray(selectedApprovals) ? selectedApprovals.filter(a => a?.type === 'ERC-721') : [];
      const erc1155Selected = Array.isArray(selectedApprovals) ? selectedApprovals.filter(a => a?.type === 'ERC-1155') : [];

      let erc20Results = { successful: [], failed: [] };
      let erc721Results = { successful: [], failed: [] };
      let erc1155Results = { successful: [], failed: [] };

      if (erc20Selected.length > 0) {
        console.log("🚀 Revoking ERC-20 approvals:", erc20Selected);
        erc20Results = await revokeERC20Approvals(erc20Selected, signer);
      }

      if (erc721Selected.length > 0) {
        console.log("🚀 Revoking ERC-721 approvals:", erc721Selected);
        erc721Results = await revokeERC721Approvals(erc721Selected, signer);
      }

      if (erc1155Selected.length > 0) {
        console.log("🚀 Revoking ERC-1155 approvals:", erc1155Selected);
        erc1155Results = await revokeERC1155Approvals(erc1155Selected, signer);
      }

      // ✅ FIX: Safe array operation with null check for Redux state
      dispatch(setApprovals(prevApprovals => {
        if (!Array.isArray(prevApprovals)) return [];
        
        return prevApprovals.filter(approval => {
          if (!approval) return false;
          
          if (approval.type === 'ERC-20') {
            return !erc20Results.successful.some(a => a.contract === approval.contract && a.spender === approval.spender);
          }
          if (approval.type === 'ERC-721') {
            return !erc721Results.successful.some(a => a.contract === approval.contract && a.spender === approval.spender);
          }
          if (approval.type === 'ERC-1155') {
            return !erc1155Results.successful.some(a => a.contract === approval.contract && a.spender === approval.spender);
          }
          return true;
        });
      }));
      
      setSelectedApprovals([]);
      setResults({ success: true, message: "Revocations successful!" });
    } catch (error) {
      console.error("❌ Batch revocation error:", error);
      setResults({ success: false, message: error.message || "Failed to revoke approvals" });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">🔥 Select and Revoke Approvals</h5>
      </div>
      <div className="card-body">
        {/* Content here */}
      </div>
    </div>
  );
};

export default BatchRevoke;

