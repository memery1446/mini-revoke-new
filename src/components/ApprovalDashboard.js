import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";  // Import necessary batching function if needed
import { batchRevokeERC721Approvals } from "../utils/nftApprovals"; // Import for ERC-721 revocation
import { Contract } from 'ethers';
import { NFT_ABI, CONTRACT_ADDRESSES } from "../constants/abis"; 

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals);
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

      const erc20Approvals = await getERC20Approvals(tokenContracts, userAddress) || [];
      const erc721Approvals = await getERC721Approvals(userAddress) || [];
      const erc1155Approvals = await getERC1155Approvals(userAddress) || [];

      const newApprovals = [
        ...erc20Approvals.map(a => ({ ...a, type: 'ERC-20' })),
        ...erc721Approvals.map(a => ({ ...a, type: 'ERC-721' })),
        ...erc1155Approvals.map(a => ({ ...a, type: 'ERC-1155' })),
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

  // Handle the revocation of a specific ERC-721 NFT approval
  const handleRevokeERC721 = async (tokenId) => {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress(); // Get the wallet address
    const nftContract = new Contract(CONTRACT_ADDRESSES.TestNFT, NFT_ABI, signer); // Instantiate contract for ERC-721

    try {
      const owner = await nftContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        alert(`💔 You are not the owner of token ID ${tokenId}.`);
        return; // Stop if the user is not the owner
      }

      // Perform revocation of the specific NFT
      await nftContract.approve(userAddress, 0); // Assuming you revoke by setting approval to the zero address
      alert("✅ Successfully revoked the NFT approval!");

      // Optionally refresh approvals after a successful revocation
      fetchApprovals(); // Refresh the list of approvals

    } catch (error) {
      console.error("❌ Revocation error:", error);
      alert("❌ Error: " + error.message || "Failed to revoke the approval");
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
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>Contract</th>
                  <th>Type</th>
                  <th>Spender</th>
                  <th>Approved Amount/Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.length > 0 ? (
                  approvals.map((approval) => (
                    <tr key={approval.id}>
                      <td>{approval.tokenSymbol || approval.contract}</td>
                      <td>{approval.type}</td>
                      <td>{approval.spenderName || approval.spender}</td>
                      <td>{approval.type === "ERC-20" ? approval.amount : approval.isApproved ? "✅ Approved" : "❌ Not Approved"}</td>
                      <td>
                        {approval.type === 'ERC-721' && (
                          <button onClick={() => handleRevokeERC721(approval.tokenId)} className="btn btn-danger">Revoke NFT</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-4">No approvals found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;
