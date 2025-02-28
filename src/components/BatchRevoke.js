// BatchRevoke.js Component with Debugging & Fixes
import React, { useState } from "react";
import { Contract } from "ethers";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals";
import { batchRevokeERC1155Approvals } from "../utils/erc1155Approvals";
import { getProvider, getSigner } from "../utils/providerService";

const BatchRevoke = ({ selectedApprovals = [], setSelectedApprovals }) => {
    const [isRevoking, setIsRevoking] = useState(false);
    
    // Debugging Logs
    console.log("✅ BatchRevoke Component Loaded");
    console.log("selectedApprovals:", selectedApprovals);
    console.log("Type of selectedApprovals:", typeof selectedApprovals);
    console.log("Is selectedApprovals an array:", Array.isArray(selectedApprovals));
    
    const handleBatchRevoke = async () => {
        if (!selectedApprovals || !Array.isArray(selectedApprovals) || selectedApprovals.length === 0) {
            console.warn("No approvals selected or selectedApprovals is not an array");
            return;
        }
        
        if (!window.confirm(`🚨 Are you sure you want to revoke ${selectedApprovals.length} approvals?`)) {
            return;
        }

        console.log("🚀 Approvals being revoked:", selectedApprovals);
        setIsRevoking(true);
        
        try {
            const signer = await getSigner();
            if (!signer) {
                throw new Error("Failed to get signer. Please ensure wallet is connected.");
            }
            
            const erc20Approvals = selectedApprovals.filter(a => a.type === "ERC-20");
            const erc721Approvals = selectedApprovals.filter(a => a.type === "ERC-721");
            const erc1155Approvals = selectedApprovals.filter(a => a.type === "ERC-1155");
            
            if (erc20Approvals.length > 0) {
                console.log(`⏳ Processing ${erc20Approvals.length} ERC-20 approvals...`);
                const tokenContractsWithSpenders = erc20Approvals.map(approval => ({
                    contract: approval.contract,
                    spender: approval.spender
                }));
                await batchRevokeERC20Approvals(tokenContractsWithSpenders, signer);
            }
            
            if (erc721Approvals.length > 0) {
                console.log("⏳ Processing ERC-721 approvals...");
                const tokenIds = erc721Approvals.map(approval => approval.tokenId);
                await batchRevokeERC721Approvals(await signer.getAddress(), tokenIds);
            }
            
            if (erc1155Approvals.length > 0) {
                console.log(`⏳ Processing ${erc1155Approvals.length} ERC-1155 approvals...`);
                const spenders = erc1155Approvals.map(approval => approval.spender);
                await batchRevokeERC1155Approvals(spenders);
            }

            setSelectedApprovals([]);
            alert("✅ Batch revocation successful!");
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error("❌ Error in batch revocation:", error);
            alert(`Error: ${error.message || "Unknown error during batch revocation"}`);
        } finally {
            setIsRevoking(false);
        }
    };

    return (
        <div className="alert alert-warning">
            <h5>🚨 Batch Revoke</h5>
            <p>
                You have selected {selectedApprovals?.length || 0} approval{selectedApprovals.length !== 1 ? 's' : ''} 
                for revocation.
            </p>
            <button 
                className="btn btn-danger" 
                onClick={handleBatchRevoke}
                disabled={!selectedApprovals || selectedApprovals.length === 0 || isRevoking}
            >
                {isRevoking ? "Processing..." : "Revoke Selected"}
            </button>
            <button 
                className="btn btn-outline-secondary" 
                onClick={() => setSelectedApprovals([])}
                disabled={!selectedApprovals || selectedApprovals.length === 0 || isRevoking}
            >
                Clear Selection
            </button>
        </div>
    );
};

export default BatchRevoke;
