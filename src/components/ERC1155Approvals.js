import React, { useEffect, useState } from "react";
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis";
import { JsonRpcProvider, BrowserProvider, Contract, getAddress } from "ethers";
import { getProvider } from "../utils/provider"; // Use shared provider logic
import { CONTRACT_ADDRESSES } from "../constants/abis";

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

// Add this function to your component
const handleDirectERC1155Revoke = async () => {
  if (!selectedApproval || processing) return;
  
  setProcessing(true);
  setMessage({type: 'info', text: 'Preparing ERC-1155 revocation...'});
  
  try {
    console.log("🎮 ERC-1155 direct revocation");
    console.log("Contract:", CONTRACT_ADDRESSES.ERC1155);
    console.log("Spender:", CONTRACT_ADDRESSES.MockSpender);
    
    // Get provider directly from window.ethereum
    if (!window.ethereum) {
      throw new Error("No ethereum provider found");
    }
    
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log("Signer address:", await signer.getAddress());
    
    // Create minimal contract
    const contract = new Contract(
      CONTRACT_ADDRESSES.ERC1155,
      ["function setApprovalForAll(address,bool)"],
      signer
    );
    
    console.log("Contract created, calling setApprovalForAll");
    setMessage({type: 'info', text: 'Please confirm in your wallet...'});
    
    // Call setApprovalForAll
    const tx = await contract.setApprovalForAll(CONTRACT_ADDRESSES.MockSpender, false);
    console.log("Transaction sent:", tx.hash);
    
    setMessage({type: 'info', text: 'Transaction sent, waiting for confirmation...'});
    await tx.wait();
    
    console.log("Transaction confirmed!");
    setMessage({type: 'success', text: 'ERC-1155 approval revoked!'});
    
    // Force a refresh of the approvals list
    setTimeout(() => {
      dispatch({type: 'web3/setApprovals', payload: []});  // Clear approvals first
      setTimeout(loadApprovals, 500);  // Then reload
    }, 1000);
    
  } catch (error) {
    console.error("Error in ERC-1155 revocation:", error);
    setMessage({type: 'danger', text: `Error: ${error.message}`});
  } finally {
    setProcessing(false);
  }
};

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
console.log("🟢 UI Approvals Before Rendering:", approvals.length, approvals);
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
    {approvals.length > 0 ? (
        approvals.map((approval) => (
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
                        <span className="badge bg-secondary">Not Approved"
                    )}
                </td>
                <td>
{selectedApproval?.type === 'ERC-1155' ? (
  <button 
    className="btn btn-sm btn-danger me-2"
    onClick={handleDirectERC1155Revoke}
    disabled={processing}
  >
    {processing ? 'Processing...' : 'Revoke ERC-1155'}
  </button>
) : (
  <button 
    className="btn btn-sm btn-danger me-2" 
    onClick={handleRevoke}
    disabled={processing}
  >
    Revoke
  </button>
)}
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan="3" className="text-center py-3">No approvals found.</td>
        </tr>
    )}
</tbody>

                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ERC1155Approvals;
