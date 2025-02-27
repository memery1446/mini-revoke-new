import React from "react";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals";
import { batchRevokeERC1155Approvals } from "../utils/erc1155Approvals";
import { getProvider } from "../utils/provider";

const BatchRevoke = ({ selectedApprovals, setSelectedApprovals }) => {
    const handleBatchRevoke = async () => {
        if (!window.confirm(`🚨 Are you sure you want to revoke ${selectedApprovals.length} approvals?`)) {
            return;
        }

        console.log("🚀 Approvals being revoked:", selectedApprovals);
        try {
            const provider = await getProvider();
            const signer = await provider.getSigner();
            
            // Group approvals by type
            const erc20Approvals = selectedApprovals.filter(a => a.type === "ERC-20");
            const erc721Approvals = selectedApprovals.filter(a => a.type === "ERC-721");
            const erc1155Approvals = selectedApprovals.filter(a => a.type === "ERC-1155");
            
// Handle ERC-20 approvals
if (erc20Approvals.length > 0) {
  const tokenContractsWithSpenders = erc20Approvals.map((approval) => ({
    contract: approval.contract,
    spender: approval.spender
  }));
  console.log("⏳ Sending batch revoke transaction for ERC-20:", tokenContractsWithSpenders);
  await batchRevokeERC20Approvals(tokenContractsWithSpenders, signer);
}
            
            // Handle ERC-721 approvals
            if (erc721Approvals.length > 0) {
                const tokenIds = erc721Approvals.map((approval) => approval.tokenId);
                console.log("⏳ Sending batch revoke transaction for ERC-721:", tokenIds);
                await batchRevokeERC721Approvals(await signer.getAddress(), tokenIds);
            }
            
            // Handle ERC-1155 approvals
            if (erc1155Approvals.length > 0) {
                const spenders = erc1155Approvals.map((approval) => approval.spender);
                console.log("⏳ Sending batch revoke transaction for ERC-1155:", spenders);
                await batchRevokeERC1155Approvals(spenders);
            }

            setSelectedApprovals([]); // Clear selection after revocation
            alert("✅ Batch revocation successful!");
        } catch (error) {
            console.error("❌ Error in batch revocation:", error);
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="alert alert-warning">
            <h5>🚨 Batch Revoke</h5>
            <p>You have selected {selectedApprovals.length} approvals for revocation.</p>
            <button className="btn btn-danger" onClick={handleBatchRevoke}>
                Revoke Selected
            </button>
        </div>
    );
};

export default BatchRevoke;

