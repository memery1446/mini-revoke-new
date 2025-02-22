import React, { useEffect, useState } from "react";
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis";
import { JsonRpcProvider, BrowserProvider, Contract, getAddress } from "ethers";
import { getProvider } from "../utils/provider"; // Use shared provider logic

const ERC1155Approvals = ({ contractAddress, owner }) => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [networkInfo, setNetworkInfo] = useState(null);
    const [revoking, setRevoking] = useState({});

    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                console.log("🔍 Fetching approvals for contract:", contractAddress);
                console.log("👤 Owner address:", owner);

                if (!contractAddress || !owner) {
                    throw new Error("❌ Missing contract address or owner address");
                }

                // Use getProvider() to fetch the provider correctly
                const provider = await getProvider();
                const network = await provider.getNetwork();

                setNetworkInfo({
                    name: network.name || "Hardhat",
                    chainId: network.chainId,
                });

                console.log(`🌐 Connected to network: ${network.name} (ID: ${network.chainId})`);

                // Verify contract existence
                const code = await provider.getCode(contractAddress);
                if (code === "0x") {
                    throw new Error(`❌ Contract doesn't exist at ${contractAddress} on this network`);
                }

                const contract = new Contract(contractAddress, ERC1155_ABI, provider);

                // Known spender addresses to check
                const spenderAddresses = [CONTRACT_ADDRESSES.MockSpender];

                // Fetch approvals for each spender
                const approvalPromises = spenderAddresses.map(async (spender) => {
                    try {
                        const validSpender = getAddress(spender); // Ensure valid address
                        console.log(`🔍 Checking approval for owner=${owner}, spender=${validSpender}`);
                        const isApproved = await contract.isApprovedForAll(owner, validSpender);

                        return {
                            spender: validSpender,
                            isApproved,
                            id: `${validSpender}-${owner}`,
                        };
                    } catch (err) {
                        console.error(`⚠️ Error checking approval for ${spender}:`, err);
                        return { spender, error: err.message, isApproved: false, id: `${spender}-${owner}` };
                    }
                });

                const results = await Promise.all(approvalPromises);
                setApprovals(results.filter((result) => result !== null));
            } catch (err) {
                console.error("❌ Error fetching ERC-1155 approvals:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (contractAddress && owner) {
            fetchApprovals();
        }
    }, [contractAddress, owner]);

    const revokeApproval = async (spender) => {
        try {
            setRevoking((prev) => ({ ...prev, [spender]: true }));

            // Use provider from MetaMask to sign transactions
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(contractAddress, ERC1155_ABI, signer);

            console.log(`🚨 Revoking approval for spender: ${spender}`);
            const tx = await contract.setApprovalForAll(spender, false);
            await tx.wait();

            setApprovals((prev) =>
                prev.map((approval) =>
                    approval.spender === spender ? { ...approval, isApproved: false } : approval
                )
            );

            alert(`✅ Successfully revoked approval for ${spender}`);
        } catch (err) {
            console.error("❌ Failed to revoke approval:", err);
            alert(`Error revoking approval: ${err.message}`);
        } finally {
            setRevoking((prev) => ({ ...prev, [spender]: false }));
        }
    };

    const formatAddress = (address) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h3 className="mb-0">ERC-1155 Approvals</h3>
                {networkInfo && (
                    <span className={`badge ${networkInfo.chainId === 1337 ? "bg-success" : "bg-secondary"}`}>
                        {networkInfo.name} (ID: {networkInfo.chainId})
                    </span>
                )}
            </div>

            <div className="card-body">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Fetching ERC-1155 approvals...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">
                        <h5>⚠️ Error</h5>
                        <p>{error}</p>
                        <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
                            🔄 Retry
                        </button>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="alert alert-info">
                        <h5>ℹ️ No Active Approvals</h5>
                        <p>No ERC-1155 approvals found for this contract.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Spender</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvals.map((approval) => (
                                    <tr key={approval.id} className={approval.error ? "table-danger" : ""}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <span className="font-monospace">{formatAddress(approval.spender)}</span>
                                                <button
                                                    className="btn btn-sm btn-link ms-2"
                                                    onClick={() => navigator.clipboard.writeText(approval.spender)}
                                                    title="Copy address"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            {approval.error ? (
                                                <span className="badge bg-danger" title={approval.error}>Error</span>
                                            ) : approval.isApproved ? (
                                                <span className="badge bg-success">Approved</span>
                                            ) : (
                                                <span className="badge bg-secondary">Not Approved</span>
                                            )}
                                        </td>
                                        <td>
                                            {approval.isApproved && !approval.error && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => revokeApproval(approval.spender)}
                                                    disabled={revoking[approval.spender]}
                                                >
                                                    {revoking[approval.spender] ? "Revoking..." : "🚫 Revoke"}
                                                </button>
                                            )}
                                        </td>
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

export default ERC1155Approvals;
