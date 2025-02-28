import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals"; // Ensure this import exists

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeResults, setRevokeResults] = useState(null);

  useEffect(() => {
    if (wallet) {
      fetchApprovals();
    }
  }, [wallet]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    setRevokeResults(null);
    console.log("🔄 Starting approval fetch process...");

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("🔍 Wallet Address:", userAddress);

      const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2];
      console.log("📋 Token contracts to check:", tokenContracts);

      console.log("📡 Fetching ERC-20 approvals...");
      const erc20Approvals = await getERC20Approvals(tokenContracts, userAddress) || [];
      console.log("✅ Raw ERC-20 Approvals Fetched:", erc20Approvals);

      console.log("📡 Fetching ERC-721 approvals...");
      const erc721Approvals = await getERC721Approvals(userAddress) || [];
      console.log("✅ Raw ERC-721 Approvals Fetched:", erc721Approvals);

      console.log("📡 Fetching ERC-1155 approvals...");
      const erc1155Approvals = await getERC1155Approvals(userAddress) || [];
      console.log("✅ Raw ERC-1155 Approvals Fetched:", erc1155Approvals);

      const newApprovals = [
        ...erc20Approvals.map(a => ({ ...a, type: 'ERC-20', id: `erc20-${a.contract}-${a.spender}` })),
        ...erc721Approvals.map(a => ({ ...a, type: 'ERC-721', id: `erc721-${a.contract}-${a.tokenId}` })),
        ...erc1155Approvals.map(a => ({ ...a, type: 'ERC-1155', id: `erc1155-${a.contract}-${a.spender}` })),
      ];

      console.log("🟢 Final approvals before dispatch:", newApprovals);
      dispatch(setApprovals(newApprovals));
    } catch (error) {
      console.error("❌ Error fetching approvals:", error);
      dispatch(setApprovals([]));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectApproval = (approval) => {
    console.log("🔍 Toggling selection for:", approval);
    setSelectedApprovals(prev => {
      const isSelected = prev.some(a => a.id === approval.id);
      if (isSelected) {
        return prev.filter(a => a.id !== approval.id);
      } else {
        return [...prev, approval];
      }
    });
  };

  const handleBatchRevoke = async () => {
    if (selectedApprovals.length === 0) {
      console.warn("⚠️ No approvals selected");
      return;
    }

    setIsLoading(true);
    setRevokeResults(null);

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();

      // Filter and revoke ERC-20 approvals
      const erc20Approvals = selectedApprovals.filter(a => a.type === 'ERC-20');
      if (erc20Approvals.length > 0) {
          const revokeResults = await batchRevokeERC20Approvals(erc20Approvals, signer);
          console.log("✅ Revocation results for ERC-20:", revokeResults);
      } else {
          console.log("ℹ️ No ERC-20 approvals selected.");
      }

      // Filter and revoke ERC-721 approvals
      const erc721Approvals = selectedApprovals.filter(a => a.type === 'ERC-721');
      if (erc721Approvals.length > 0) {
          const revokeResults = await batchRevokeERC721Approvals(erc721Approvals, signer);
          console.log("✅ Revocation results for ERC-721:", revokeResults);
      } else {
          console.log("ℹ️ No ERC-721 approvals selected.");
      }

      // Update results in state as necessary
      setRevokeResults({ success: true, message: "Revocation process completed!" });
      setSelectedApprovals([]); // Clear selections on success
    } catch (error) {
      console.error("❌ Batch revocation error:", error);
      setRevokeResults({ success: false, message: error.message || "Failed to revoke approvals" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h2 className="card-title">Approval Dashboard</h2>
        <button 
          className="btn btn-secondary" 
          onClick={fetchApprovals}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh Approvals'}
        </button>
      </div>
      <div className="card-body">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading approvals...</span>
            </div>
            <p className="mt-3">Loading approvals...</p>
          </div>
        ) : (
          <>
            {/* Your existing rendering logic here */}
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;

