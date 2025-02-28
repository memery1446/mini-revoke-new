import React, { useState, useEffect } from 'react';
import { getProvider } from './utils/ethersUtils';
import { batchRevokeERC20Approvals, batchRevokeERC721Approvals, batchRevokeERC1155Approvals } from './utils/revokeUtils';

const ApprovalDashboard = () => {
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeResults, setRevokeResults] = useState(null);
  const [wallet, setWallet] = useState(''); // Assuming wallet address is needed

  // Placeholder for fetchApprovals function - replace with actual implementation
  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      // Simulate fetching approvals (replace with actual API call)
      const mockApprovals = [
        { id: 1, type: 'ERC-20', contract: '0xContract1', spender: '0xSpender1', amount: '100' },
        { id: 2, type: 'ERC-721', contract: '0xContract2', tokenId: '123' },
        { id: 3, type: 'ERC-1155', contract: '0xContract3', spender: '0xSpender2', amount: '50' },
      ];
      setApprovals(mockApprovals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleSingleRevoke = async (approval) => {
    console.log("🔥 Revoking single approval:", approval);
    setIsLoading(true);
    setRevokeResults(null);
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      let result;
      
      if (approval.type === "ERC-20") {
        console.log("🔥 Revoking ERC-20 approval:", approval);
        // Use the existing batch function with a single item
        result = await batchRevokeERC20Approvals([{
          contract: approval.contract, 
          spender: approval.spender
        }], signer);
      } else if (approval.type === "ERC-721") {
        console.log("🔥 Revoking ERC-721 approval:", approval);
        result = await batchRevokeERC721Approvals(wallet, [approval.tokenId]);
      } else if (approval.type === "ERC-1155") {
        console.log("🔥 Revoking ERC-1155 approval:", approval);
        result = await batchRevokeERC1155Approvals([approval.spender]);
      }
      
      console.log("✅ Single revocation result:", result);
      setRevokeResults({
        success: true,
        successful: result.successful.length,
        failed: result.failed.length,
        details: result
      });
      
      // Refresh approvals to update the UI
      fetchApprovals();
    } catch (error) {
      console.error("❌ Error in single revocation:", error);
      setRevokeResults({
        success: false,
        message: error.message || "Failed to revoke approval"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Approval Dashboard</h1>
      {isLoading && <p>Loading...</p>}
      {revokeResults && (
        <div>
          {revokeResults.success ? (
            <p>Revocation successful! Successful: {revokeResults.successful}, Failed: {revokeResults.failed}</p>
          ) : (
            <p>Revocation failed: {revokeResults.message}</p>
          )}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Contract</th>
            <th>Spender/Token ID</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval) => (
            <tr key={approval.id}>
              <td>{approval.type}</td>
              <td>{approval.contract}</td>
              <td>{approval.spender || approval.tokenId}</td>
              <td>{approval.amount || '-'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-danger" 
                  onClick={() => handleSingleRevoke(approval)}
                  disabled={isLoading}
                >
                  🚨 Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApprovalDashboard;
