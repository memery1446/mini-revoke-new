import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { useSelector, useDispatch } from "react-redux";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { addApproval as addApprovalAction, removeApproval as removeApprovalAction } from "../store/web3Slice"; 

const ExistingApprovals = () => {
    const dispatch = useDispatch();
    const account = useSelector((state) => state.web3.account);
    const approvals = useSelector((state) => state.web3.approvals);

    const [fetchedApprovals, setFetchedApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Use Hardhat localhost provider as fallback
    const provider = window.ethereum
        ? new BrowserProvider(window.ethereum)
        : new JsonRpcProvider("http://127.0.0.1:8545");

    useEffect(() => {
        if (!account) {
            console.log("⏳ Waiting for Redux to update account...");
            return;
        }

        if (approvals.length === 0) {
            console.log("🔄 Fetching approvals now...");
            fetchApprovals();
        }
    }, [account, approvals]);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            setError(null);

            const tokenContracts = [
                CONTRACT_ADDRESSES.TK1,
                CONTRACT_ADDRESSES.TK2,
            ];

            const fetched = await getERC20Approvals(tokenContracts, account);
            if (!fetched || fetched.length === 0) {
                console.log("ℹ️ No approvals found.");
            }

            fetched.forEach((approval) => {
                dispatch(addApprovalAction(approval));
            });

            setFetchedApprovals(fetched);
        } catch (err) {
            console.error("❌ Error fetching approvals:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const revokeApproval = async (approval) => {
        try {
            console.log("🚨 Revoking approval for:", approval.contract);

            const signer = await provider.getSigner();
            const tokenContract = new Contract(approval.contract, [
                "function approve(address spender, uint256 amount) external returns (bool)"
            ], signer);

            const tx = await tokenContract.approve(approval.spender, 0);
            await tx.wait();

            console.log("✅ Approval revoked!");
            dispatch(removeApprovalAction({ token: approval.contract }));
            fetchApprovals();
        } catch (err) {
            console.error("❌ Error revoking approval:", err);
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
                <h3 className="mb-0">Existing Approvals</h3>
            </div>

            <div className="card-body">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading approvals...</span>
                        </div>
                        <p className="mt-3">Fetching approvals...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">
                        <p>{error}</p>
                    </div>
                ) : fetchedApprovals.length === 0 ? (
                    <div className="alert alert-info">
                        <p>No active approvals found.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Contract</th>
                                    <th>Spender</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fetchedApprovals.map((approval, index) => (
                                    <tr key={index}>
                                        <td>
                                            <span className="d-inline-block text-truncate" style={{ maxWidth: "150px" }}>
                                                {approval.contract}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="d-inline-block text-truncate" style={{ maxWidth: "150px" }}>
                                                {approval.spender}
                                            </span>
                                        </td>
                                        <td>{approval.amount}</td>
                                        <td>
                                            <button 
                                                className="btn btn-danger btn-sm"
                                                onClick={() => revokeApproval(approval)}
                                            >
                                                🚨 Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card-footer bg-light">
                <small className="text-muted">
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={fetchApprovals}
                        disabled={loading}
                    >
                        🔄 Refresh
                    </button>
                </small>
            </div>
        </div>
    );
};

export default ExistingApprovals;
