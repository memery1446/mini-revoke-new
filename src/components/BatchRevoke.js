import React from "react";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils"; // ✅ Import the function
import { getProvider } from "../utils/provider";
import { Contract } from "ethers";

const BatchRevoke = ({ selectedApprovals, setSelectedApprovals }) => {
    const handleBatchRevoke = async () => {
        if (!window.confirm("🚨 Are you sure you want to revoke these approvals?")) {
            return;
        }

        console.log("🚨 Revoking selected approvals:", selectedApprovals);
        try {
            const provider = await getProvider();
            const signer = await provider.getSigner();
            
            const tokenContracts = selectedApprovals.map((approval) => approval.contract);
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

// ✅ Ensure we export the React component
export default BatchRevoke;
