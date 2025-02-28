import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals"; // Ensure this import exists
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
            ...erc20Approvals.map(a => ({ ...a, type: 'ERC-20', id: `erc20-${a.contract}-${a.spender}` })),
            ...erc721Approvals.map(a => ({ ...a, type: 'ERC-721', id: `erc721-${a.contract}-${a.tokenId}` })),
            ...erc1155Approvals.map(a => ({ ...a, type: 'ERC-1155', id: `erc1155-${a.contract}-${a.spender}` })),
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
    setRevokeResults(null); // Reset previous results

    try {
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress(); // Get the wallet address

        const contractAddress = CONTRACT_ADDRESSES.TestNFT; // Ensure this points to your NFT contract
        const nftContract = new Contract(contractAddress, NFT_ABI, signer); // Instantiate contract for ERC-721

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
            const idsToRevoke = [];
            for (const approval of erc721Approvals) {
                const owner = await nftContract.ownerOf(approval.tokenId); // Ensure the contract instance is used here
                if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                    console.log(`💔 Not owner of token ID ${approval.tokenId}. Cannot revoke.`);
                    continue; // Skip revocation for tokens not owned by the user
                }
                idsToRevoke.push(approval.tokenId);
            }

            if (idsToRevoke.length > 0) {
                const revokeResults = await batchRevokeERC721Approvals(userAddress, idsToRevoke);
                console.log("✅ Revocation results for ERC-721:", revokeResults);
            } else {
                console.log("ℹ️ No eligible ERC-721 approvals to revoke.");
            }
        }

        // Optionally handle results accordingly
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
          {revokeResults && (
              <div className={`alert ${revokeResults.success ? 'alert-success' : 'alert-danger'} mb-4`}>
                {revokeResults.success ? (
                  <div>
                    <h5>✅ Batch Revocation Results</h5>
                    <p>Successfully revoked {revokeResults.successful} approval(s)</p>
                    {revokeResults.failed > 0 && <p>Failed to revoke {revokeResults.failed} approval(s)</p>}
                  </div>
                ) : (
                  <div>
                    <h5>❌ Revocation Error</h5>
                    <p>{revokeResults.message}</p>
                  </div>
                )}
              </div>
            )}
            
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
                        <td className="text-truncate" style={{ maxWidth: '150px' }}>
                          {approval.tokenSymbol || approval.contract}
                        </td>
                        <td>{approval.type}</td>
                        <td className="text-truncate" style={{ maxWidth: '150px' }}>
                          {approval.spenderName || approval.spender}
                        </td>
                        <td>{approval.type === "ERC-20" ? approval.amount : approval.isApproved ? "✅ Approved" : "❌ Not Approved"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-4">No approvals found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="small text-muted">
                {selectedApprovals.length} approval(s) selected
              </div>
              <button 
                className="btn btn-danger" 
                onClick={handleBatchRevoke}
                disabled={isLoading || selectedApprovals.length === 0}
              >
                {isLoading ? 'Revoking...' : `🚨 Revoke Selected (${selectedApprovals.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;

