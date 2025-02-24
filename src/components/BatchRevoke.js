import React from "react";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils"; // ✅ Import revocation logic
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
            
            const tokenContracts = selectedApprovals.map((approval) => approval.contract);
            console.log("⏳ Sending batch revoke transaction for:", tokenContracts);

            await batchRevokeERC20Approvals(tokenContracts, signer); // ✅ Call the function

            setSelectedApprovals([]); // ✅ Clear selection after revocation
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

