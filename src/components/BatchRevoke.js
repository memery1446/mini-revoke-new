// BatchRevoke.js Component
import React, { useState } from "react";
import { Contract } from "ethers";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals";
import { batchRevokeERC1155Approvals } from "../utils/erc1155Approvals";
import { getProvider, getSigner } from "../utils/providerService"; // Update to use providerService

const BatchRevoke = ({ selectedApprovals, setSelectedApprovals }) => {
    const [isRevoking, setIsRevoking] = useState(false);

    const handleBatchRevoke = async () => {
        if (selectedApprovals.length === 0) {
            console.log("No approvals selected");
            return;
        }
        
        if (!window.confirm(`🚨 Are you sure you want to revoke ${selectedApprovals.length} approvals?`)) {
            return;
        }

        console.log("🚀 Approvals being revoked:", selectedApprovals);
        setIsRevoking(true);
        
        try {
            // Get signer directly from providerService
            const signer = await getSigner();
            if (!signer) {
                throw new Error("Failed to get signer. Please ensure wallet is connected.");
            }
            
            // Group approvals by type
            const erc20Approvals = selectedApprovals.filter(a => a.type === "ERC-20");
            const erc721Approvals = selectedApprovals.filter(a => a.type === "ERC-721");
            const erc1155Approvals = selectedApprovals.filter(a => a.type === "ERC-1155");
            
            // Handle ERC-20 approvals 
            if (erc20Approvals.length > 0) {
                console.log(`⏳ Processing ${erc20Approvals.length} ERC-20 approvals...`);
                const tokenContractsWithSpenders = erc20Approvals.map((approval) => ({
                    contract: approval.contract,
                    spender: approval.spender
                }));
                await batchRevokeERC20Approvals(tokenContractsWithSpenders, signer);
            }
            
            // Handle ERC-721 approvals
            if (erc721Approvals.length > 0) {
                console.log(`⏳ Processing ${erc721Approvals.length} ERC-721 approvals...`);
                await batchRevokeERC721Approvals(await signer.getAddress());
            }
            
            // Handle ERC-1155 approvals
            if (erc1155Approvals.length > 0) {
                console.log(`⏳ Processing ${erc1155Approvals.length} ERC-1155 approvals...`);
                const spenders = erc1155Approvals.map((approval) => approval.spender);
                await batchRevokeERC1155Approvals(spenders);
            }

            setSelectedApprovals([]); // Clear selection after revocation
            alert("✅ Batch revocation successful!");
            
            // Instead of page reload, use a more targeted approach
            setTimeout(() => {
                window.location.reload(); // Give time for blockchain to update
            }, 2000);
        } catch (error) {
            console.error("❌ Error in batch revocation:", error);
            alert(`Error: ${error.message || "Unknown error during batch revocation"}`);
        } finally {
            setIsRevoking(false);
        }
    };

    // Helper function to show approval type counts
    const getApprovalTypeCounts = () => {
        const erc20Count = selectedApprovals.filter(a => a.type === "ERC-20").length;
        const erc721Count = selectedApprovals.filter(a => a.type === "ERC-721").length;
        const erc1155Count = selectedApprovals.filter(a => a.type === "ERC-1155").length;
        
        const parts = [];
        if (erc20Count > 0) parts.push(`${erc20Count} ERC-20`);
        if (erc721Count > 0) parts.push(`${erc721Count} ERC-721`);
        if (erc1155Count > 0) parts.push(`${erc1155Count} ERC-1155`);
        
        return parts.join(", ");
    };

    return (
        <div className="alert alert-warning">
            <h5>🚨 Batch Revoke</h5>
            <p>
                You have selected {selectedApprovals.length} approval{selectedApprovals.length !== 1 ? 's' : ''} 
                for revocation ({getApprovalTypeCounts()}).
            </p>
            <div className="d-flex gap-2">
                <button 
                    className="btn btn-danger" 
                    onClick={handleBatchRevoke}
                    disabled={selectedApprovals.length === 0 || isRevoking}
                >
                    {isRevoking ? "Processing..." : "Revoke Selected"}
                </button>
                <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => setSelectedApprovals([])}
                    disabled={selectedApprovals.length === 0 || isRevoking}
                >
                    Clear Selection
                </button>
            </div>
        </div>
    );
};

export default BatchRevoke;

