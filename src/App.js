import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import WalletConnect from "./components/WalletConnect.js";
import NetworkSelector from "./components/NetworkSelector.js";
import ExistingApprovals from "./components/ExistingApprovals.js";
import BatchRevoke from "./components/BatchRevoke.js"; // ✅ Add Batch Revoke Component
import "bootstrap/dist/css/bootstrap.min.css";
import { BootstrapWrapper } from "./utils/provider";

const App = () => {
    const wallet = useSelector((state) => state.web3.account);
    const network = useSelector((state) => state.web3.network);
    const [selectedApprovals, setSelectedApprovals] = useState([]); // ✅ Track selected approvals

    useEffect(() => {
        console.log("Wallet:", wallet);
        console.log("Network:", network);
    }, [wallet, network]);

    // ✅ Toggle selection of approvals for batch revoke
const toggleApprovalSelection = (approval) => {
    setSelectedApprovals((prev) => {
        const updated = prev.some((a) => a.id === approval.id)
            ? prev.filter((a) => a.id !== approval.id) // Remove if already selected
            : [...prev, approval]; // Add if not selected

        console.log("✅ Updated Selected Approvals:", updated);
        return updated;
    });
};


    return (
        <BootstrapWrapper>
            <div className="container my-5">
                {/* 🔹 Header Section */}
                <header className="mb-4 text-center">
                    <h1 className="text-primary fw-bold">
                        <span className="me-2">🔒</span> Approval Manager
                    </h1>
                    <p className="text-muted">Review and revoke token approvals to protect your assets.</p>
                </header>

                {/* 🔹 Connection Section */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <WalletConnect />
                    </div>
                    <div className="col-md-6">
                        <NetworkSelector />
                    </div>
                </div>

                {/* 🔹 If No Wallet is Connected */}
                {!wallet ? (
                    <div className="text-center py-5">
                        <h2>Connect Your Wallet</h2>
                        <p className="text-muted">View and manage your active token approvals.</p>
                        <div className="card mx-auto" style={{ maxWidth: "550px" }}>
                            <div className="card-body">
                                <h5 className="card-title">Why use Mini Revoke Cash?</h5>
                                <ul className="list-group list-group-flush">
                                    <li className="list-group-item">✅ View all token approvals in one place</li>
                                    <li className="list-group-item">✅ Manage ERC-20, ERC-721, and ERC-1155 approvals</li>
                                    <li className="list-group-item">✅ Batch revoke multiple approvals at once</li>
                                    <li className="list-group-item">✅ Stay safe by removing unnecessary permissions</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 🔹 Categorized Approval List with Batch Revoke */
                    <div className="row mt-4">
                        <div className="col-lg-12">
                            <ExistingApprovals onToggleSelect={toggleApprovalSelection} />
                        </div>
                        
                        {/* 🔹 Batch Revoke Section (Only Visible When Selections Exist) */}
                        {selectedApprovals.length > 0 && (
                            <div className="col-lg-12 mt-3">
                                <BatchRevoke selectedApprovals={selectedApprovals} setSelectedApprovals={setSelectedApprovals} />
                            </div>
                        )}
                    </div>
                )}

                {/* 🔹 Footer */}
                <footer className="mt-5 pt-4 border-top text-center text-muted">
                    <p><small>Mini Revoke Cash &copy; 2025</small></p>
                </footer>
            </div>
        </BootstrapWrapper>
    );
};

export default App;


