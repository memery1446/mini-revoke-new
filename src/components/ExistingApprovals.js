import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { useSelector, useDispatch } from "react-redux";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { addApproval as addApprovalAction, removeApproval as removeApprovalAction } from "../store/web3Slice";

const ExistingApprovals = ({ onToggleSelect }) => {
    const dispatch = useDispatch();
    const account = useSelector((state) => state.web3.account);
    const approvals = useSelector((state) => state.web3.approvals);

    const [fetchedApprovals, setFetchedApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const provider = window.ethereum
        ? new BrowserProvider(window.ethereum)
        : new JsonRpcProvider("http://127.0.0.1:8545");

    useEffect(() => {
        if (!account) {
            console.log("⏳ Waiting for Redux to update account...");
            return;
        }

        console.log("📌 Redux Approvals State:", approvals);
        if (approvals.length === 0) {
            console.log("🔄 Fetching approvals now...");
            fetchApprovals();
        }
    }, [account]);

useEffect(() => {
    console.log("📌 React Detected Redux Approvals Change:", approvals);
    setFetchedApprovals([...approvals]); // ✅ Force UI update
}, [approvals]); // ✅ React now listens for Redux updates


    const fetchApprovals = async () => {
        try {
            setLoading(true);
            setError(null);

            const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2];

            console.log("🔄 Fetching ERC-20 approvals...");
            const erc20Fetched = await getERC20Approvals(tokenContracts, account);
            console.log("✅ ERC-20 Approvals Fetched:", erc20Fetched);

            console.log("🔄 Fetching ERC-721 approvals...");
            const erc721Fetched = await getERC721Approvals(account);
            console.log("✅ ERC-721 Approvals Fetched:", erc721Fetched);

            console.log("🔄 Fetching ERC-1155 approvals...");
            const erc1155Fetched = await getERC1155Approvals(account);
            console.log("✅ ERC-1155 Approvals Fetched:", erc1155Fetched);

            const allApprovals = [...(erc20Fetched || []), ...(erc721Fetched || []), ...(erc1155Fetched || [])];

            if (allApprovals.length === 0) {
                console.log("ℹ️ No approvals found.");
            }

            // 🔥 Ensure state updates before dispatching to Redux
            setFetchedApprovals([...allApprovals]); // ✅ Forces React to update UI
            console.log("🟢 Approvals before dispatching to Redux:", allApprovals);

            // 🔥 Dispatch each approval to Redux
            allApprovals.forEach((approval) => {
                console.log("🚀 Dispatching Approval to Redux:", approval);
                dispatch(addApprovalAction({ ...approval })); // ✅ Forces Redux to detect update
            });

            // ✅ Force Redux to persist approvals after dispatch
            setTimeout(() => {
                console.log("🔍 Redux State After Dispatch:", window.reduxStore.getState().web3.approvals);
                if (window.reduxStore.getState().web3.approvals.length === 0) {
                    console.error("❌ Redux state is still empty after dispatch! Something is blocking updates.");
                }
            }, 2000);
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
            const isERC1155 = approval.type === "ERC-1155";
            const isERC721 = approval.type === "ERC-721";

            let tx;
            if (isERC1155) {
                const erc1155Contract = new Contract(approval.contract, [
                    "function setApprovalForAll(address operator, bool approved) external"
                ], signer);
                tx = await erc1155Contract.setApprovalForAll(approval.spender, false);
            } else if (isERC721) {
                const erc721Contract = new Contract(approval.contract, [
                    "function setApprovalForAll(address operator, bool approved) external"
                ], signer);
                tx = await erc721Contract.setApprovalForAll(approval.spender, false);
            } else {
                const tokenContract = new Contract(approval.contract, [
                    "function approve(address spender, uint256 amount) external returns (bool)"
                ], signer);
                tx = await tokenContract.approve(approval.spender, 0);
            }

            await tx.wait();
            console.log("✅ Approval revoked!");
            fetchApprovals();
        } catch (err) {
            console.error("❌ Error revoking approval:", err);
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Existing Approvals</h3>
                <button className="btn btn-secondary" onClick={fetchApprovals}>🔄 Refresh Approvals</button>
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
                                    <th>Select</th>
                                    <th>Contract</th>
                                    <th>Spender</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fetchedApprovals.map((approval, index) => (
                                    <tr key={index}>
                                        <td><input type="checkbox" onChange={() => onToggleSelect(approval)} /></td>
                                        <td>{approval.contract}</td>
                                        <td>{approval.spender}</td>
                                        <td>{approval.amount}</td>
                                        <td><button className="btn btn-danger btn-sm" onClick={() => revokeApproval(approval)}>🚨 Revoke</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExistingApprovals;
