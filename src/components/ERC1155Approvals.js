import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis";

const ERC1155Approvals = ({ contractAddress, owner }) => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [networkInfo, setNetworkInfo] = useState(null);
    const [revoking, setRevoking] = useState({});

    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                // Log the contract address and owner before proceeding
                console.log("Fetching approvals using contract address:", contractAddress);
                console.log("Fetching approvals for owner:", owner);

                if (!contractAddress || !owner) {
                    throw new Error("Missing contract address or owner address");
                }

                // Connect directly to Hardhat node - avoid any network mismatch
                const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
                
                // Get network info
                const network = await provider.getNetwork();
                setNetworkInfo({
                    name: network.name || "Hardhat",
                    chainId: network.chainId
                });
                console.log(`Connected to network: ${network.name || "Hardhat"} (ID: ${network.chainId})`);
                
                // Verify contract exists
                const code = await provider.getCode(contractAddress);
                if (code === '0x') {
                    throw new Error(`Contract doesn't exist at ${contractAddress} on this network`);
                }
                
                // Create contract instance
                const contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
                
                // Known spender addresses to check
                const spenderAddresses = [
                    CONTRACT_ADDRESSES.MockSpender, // Primary spender
                    "0x43c5df0c482c88cef8005389f64c362ee720a5bc" // Backup address
                ];

                // Check approvals for each spender
                const approvalPromises = spenderAddresses.map(async (spender) => {
                    try {
                        if (!ethers.utils.isAddress(spender)) {
                            console.error(`Invalid spender address: ${spender}`);
                            return null;
                        }
                        
                        console.log(`Checking approval for owner=${owner}, spender=${spender}`);
                        const isApproved = await contract.isApprovedForAll(owner, spender);
                        
                        return { 
                            spender, 
                            isApproved,
                            id: `${spender}-${owner}`
                        };
                    } catch (err) {
                        console.error(`Error checking approval for ${spender}:`, err);
                        return { 
                            spender, 
                            error: err.message, 
                            isApproved: false,
                            id: `${spender}-${owner}`
                        };
                    }
                });

                const results = await Promise.all(approvalPromises);
                const validResults = results.filter(result => result !== null);
                setApprovals(validResults);
                
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
            setRevoking({...revoking, [spender]: true});
            
            // Connect directly to Hardhat - avoid network mismatch
            const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, ERC1155_ABI, signer);
            
            // Revoke the approval
            console.log(`Revoking approval for spender ${spender}`);
            const tx = await contract.setApprovalForAll(spender, false);
            await tx.wait();
            
            // Update local state
            setApprovals(approvals.map(approval => 
                approval.spender === spender 
                    ? {...approval, isApproved: false} 
                    : approval
            ));
            
            alert(`Successfully revoked approval for ${spender}`);
            
        } catch (err) {
            console.error("Failed to revoke approval:", err);
            alert(`Error revoking approval: ${err.message}`);
        } finally {
            setRevoking({...revoking, [spender]: false});
        }
    };

    const formatAddress = (address) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

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
                        <p className="mt-3">Loading ERC-1155 approvals...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">
                        <h5>Error</h5>
                        <p>{error}</p>
                        <div className="text-end">
                            <button 
                                className="btn btn-outline-danger"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="alert alert-info">
                        <div className="d-flex">
                            <div className="fs-1 me-3">ℹ️</div>
                            <div>
                                <h5>No Active Approvals</h5>
                                <p className="mb-0">
                                    There are no ERC-1155 approvals for your wallet on this contract.
                                    When you approve an operator to transfer your ERC-1155 tokens, 
                                    they will appear here.
                                </p>
                            </div>
                        </div>
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
                                                    {revoking[approval.spender] ? (
                                                        <>
                                                            <span 
                                                                className="spinner-border spinner-border-sm me-1"
                                                                role="status"
                                                                aria-hidden="true"
                                                            ></span>
                                                            Revoking...
                                                        </>
                                                    ) : (
                                                        "🚫 Revoke"
                                                    )}
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
            
            <div className="card-footer">
                <small className="text-muted">
                    Contract: <code>{contractAddress}</code>
                </small>
            </div>
        </div>
    );
};

export default ERC1155Approvals;

