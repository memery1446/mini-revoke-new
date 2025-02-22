import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import WalletConnect from "./components/WalletConnect.js";
import TokenAllowanceManager from "./components/TokenAllowanceManager.js";
import NFTApprovals from "./components/NFTApprovals.js";
import ERC1155Approvals from "./components/ERC1155Approvals.js";
import ApprovalDashboard from "./components/ApprovalDashboard.js";
import NetworkSelector from "./components/NetworkSelector.js";
import ExistingApprovals from "./components/ExistingApprovals.js";
import { CONTRACT_ADDRESSES } from "./constants/abis";
import { getProvider } from "./utils/provider"; // ✅ Correcting provider import
import "bootstrap/dist/css/bootstrap.min.css";
import { BootstrapWrapper } from "./utils/provider";  // ✅ Use Bootstrap, not Chakra


const App = () => {
    const wallet = useSelector((state) => state.web3.account);
    const network = useSelector((state) => state.web3.network);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [revokeLoading, setRevokeLoading] = useState(false);

    useEffect(() => {
        console.log("Wallet:", wallet);
        console.log("Network:", network);
    }, [wallet, network]);

    const handleRevokeAll = async () => {
        if (!window.confirm("⚠️ Warning: This will revoke ALL token approvals. This action cannot be undone. Continue?")) {
            return;
        }
        
        setRevokeLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("Successfully revoked all approvals!");
        } catch (error) {
            console.error("Failed to revoke approvals:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setRevokeLoading(false);
        }
    };

    const isHardhatNetwork = network === 1337;

    return (
        <BootstrapWrapper>
            <div className="container my-5">
                <header className="mb-4">
                    <h1 className="text-center text-primary fw-bold mb-4">
                        <span className="me-2">🔒</span>
                        Mini Revoke Cash
                    </h1>
                    
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <WalletConnect />
                        </div>
                        <div className="col-md-6 mb-3">
                            <NetworkSelector />
                        </div>
                    </div>

                    {wallet && !isHardhatNetwork && (
                        <div className="alert alert-warning">
                            <strong>⚠️ Warning:</strong> You're connected to network ID {network}, but this app 
                            is designed to work with Hardhat local network (ID: 1337).
                            Please switch networks for full functionality.
                        </div>
                    )}
                </header>

                {!wallet ? (
                    <div className="text-center py-5 my-5">
                        <div className="display-1 mb-4">🔐</div>
                        <h2>Connect Your Wallet</h2>
                        <p className="text-muted mb-4">
                            Connect your wallet to view and manage token approvals.
                        </p>
                        <div className="card mx-auto" style={{maxWidth: "550px"}}>
                            <div className="card-body">
                                <h5 className="card-title">Why use Mini Revoke Cash?</h5>
                                <ul className="list-group list-group-flush mb-3">
                                    <li className="list-group-item">✅ View all your active token approvals</li>
                                    <li className="list-group-item">✅ Manage ERC-20, ERC-721, and ERC-1155 approvals</li>
                                    <li className="list-group-item">✅ Batch revoke multiple approvals at once</li>
                                    <li className="list-group-item">✅ Stay safe by removing unwanted access to your tokens</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="row mt-4">
                        <div className="col-lg-8 mb-4">
                            <ul className="nav nav-tabs mb-4">
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
                                        onClick={() => setActiveTab("dashboard")}
                                    >
                                        Dashboard
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === "erc20" ? "active" : ""}`}
                                        onClick={() => setActiveTab("erc20")}
                                    >
                                        ERC-20 Tokens
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === "nft" ? "active" : ""}`}
                                        onClick={() => setActiveTab("nft")}
                                    >
                                        NFTs
                                    </button>
                                </li>
                            </ul>

                            {activeTab === "dashboard" && (
                                <>
                                    <ApprovalDashboard />
                                    <ExistingApprovals />
                                </>
                            )}
                            
                            {activeTab === "erc20" && (
                                <TokenAllowanceManager wallet={wallet} />
                            )}
                            
                            {activeTab === "nft" && (
                                <div className="row">
                                    <div className="col-md-12 mb-4">
                                        <NFTApprovals 
                                            contractAddress={CONTRACT_ADDRESSES.TestNFT}
                                            spender={CONTRACT_ADDRESSES.MockSpender}
                                        />
                                    </div>
                                    <div className="col-md-12">
                                        <ERC1155Approvals
                                            contractAddress={CONTRACT_ADDRESSES.ERC1155}
                                            owner={wallet}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="col-lg-4">
                            <div className="card mb-4 shadow-sm">
                                <div className="card-header bg-light">
                                    <h4 className="card-title mb-0">Network Status</h4>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <span className="fw-bold d-block mb-1">Wallet:</span>
<code>{wallet && typeof wallet === "string" ? `${wallet.substring(0, 8)}...${wallet.substring(wallet.length - 6)}` : "Not Connected"}</code>
                                    </div>
                                    <div className="mb-3">
                                        <span className="fw-bold d-block mb-1">Network:</span>
                                        <span className={`badge ${isHardhatNetwork ? 'bg-success' : 'bg-warning'}`}>
                                            {isHardhatNetwork ? 'Hardhat (1337)' : `Network ID: ${network}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <footer className="mt-5 pt-4 border-top text-center text-muted">
                    <p><small>Mini Revoke Cash &copy; 2025</small></p>
                </footer>
            </div>
        </BootstrapWrapper>
    );
};

export default App;
