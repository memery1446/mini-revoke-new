import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals"; // Ensure you have this import
import { Contract } from 'ethers';
import { NFT_ABI, CONTRACT_ADDRESSES } from "../constants/abis"; 

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

      // Fetch and merge ERC-20 approvals
      console.log("📡 Fetching ERC-20 approvals...");
      const erc20Approvals = await getERC20Approvals(tokenContracts, userAddress) || [];
      console.log("✅ Raw ERC-20 Approvals Fetched:", erc20Approvals);

      // Fetch and merge ERC-721 approvals
      console.log("📡 Fetching ERC-721 approvals...");
      const erc721Approvals = await getERC721Approvals(userAddress) || [];
      console.log("✅ Raw ERC-721 Approvals Fetched:", erc721Approvals);

      // Fetch and merge ERC-1155 approvals
      console.log("📡 Fetching ERC-1155 approvals...");
      const erc1155Approvals = await getERC1155Approvals(userAddress) || [];
      console.log("✅ Raw ERC-1155 Approvals Fetched:", erc1155Approvals);

      // Combine approvals
      const newApprovals = [
        ...erc20Approvals.map(a => ({ ...a, type: 'ERC-20' })),
        ...erc721Approvals.map(a => ({ ...a, type: 'ERC-721' })),
        ...erc1155Approvals.map(a => ({ ...a, type: 'ERC-1155' })),
      ];

      console.log("🟢 Final approvals before dispatch:", newApprovals);
      dispatch(setApprovals(newApprovals)); // Set new approvals
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
        return prev.filter(a => a.id !== approval.id); // Deselect
      } else {
        return [...prev, approval]; // Select
      }
    });
  };

  const handleRevokeSingleNFT = async () => {
    // Allow only single NFT revocation
    if (selectedApprovals.length !== 1) {
      alert("⚠️ Please select exactly one NFT to revoke.");
      return;
    }

    const approvalToRevoke = selectedApprovals[0]; // Selected approval

    // Only proceed if it's an ERC-721 approval
    if (approvalToRevoke.type !== 'ERC-721') {
      alert("⚠️ Selected approval is not an ERC-721 approval.");
      return;
    }

    setIsLoading(true);
    setRevokeResults(null); // Reset previous results

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress(); // Get the wallet address

      const nftContract = new Contract(CONTRACT_ADDRESSES.TestNFT, NFT_ABI, signer); // Instantiate contract

      // Check ownership
      const owner = await nftContract.ownerOf(approvalToRevoke.tokenId);
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        alert(`💔 You are not the owner of token ID ${approvalToRevoke.tokenId}.`);
        return;
      }

      // Proceed to revoke the specific NFT approval
      await nftContract.approve(userAddress, 0); // Revoke approval by setting to zero address
      alert("✅ Successfully revoked the NFT approval!");

      // Clear selections after revocation
      setSelectedApprovals([]);
      setRevokeResults({ success: true, message: "Revocation process completed!" });

    } catch (error) {
      console.error("❌ Revocation error:", error);
      setRevokeResults({ success: false, message: error.message || "Failed to revoke approval" });
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
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Select</th>
                    <th>Contract</th>
                    <th>Type</th>
                    <th>Spender</th>
                    <th>Approved Amount/Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.length > 0 ? (
                    approvals.map((approval) => (
                      <tr key={approval.id}>
                        <td>
                          <input 
                            type="checkbox" 
                            className="form-check-input"
                            onChange={() => handleSelectApproval(approval)}
                            checked={selectedApprovals.some(a => a.id === approval.id)}
                          />
                        </td>
                        <td>{approval.tokenSymbol || approval.contract}</td>
                        <td>{approval.type}</td>
                        <td>{approval.spenderName || approval.spender}</td>
                        <td>{approval.type === "ERC-20" ? approval.amount : approval.isApproved ? "✅ Approved" : "❌ Not Approved"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-4">No approvals found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button 
              className="btn btn-danger" 
              onClick={handleRevokeSingleNFT}  // Call your single revoke function
              disabled={!selectedApprovals.length || isLoading}
            >
              🚨 Revoke Selected NFT
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;

