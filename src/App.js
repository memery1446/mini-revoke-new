import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import WalletConnect from "./components/WalletConnect.js";
import NetworkSelector from "./components/NetworkSelector.js";
import ExistingApprovals from "./components/ExistingApprovals.js";
import BatchRevoke from "./components/BatchRevoke.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { BootstrapWrapper } from "./utils/provider";
import ApprovalDebugger from "./components/ApprovalDebugger";
import { initializeProvider } from "./utils/providerService";
import { ethers } from "ethers";


// Add console log at the top level to verify file loading
console.log("🔴 App.js loaded - " + new Date().toISOString());

const App = () => {
    console.log("🔶 App component rendering");
    const dispatch = useDispatch();
    const wallet = useSelector((state) => state.web3.account);
    const network = useSelector((state) => state.web3.network);
    const approvals = useSelector((state) => state.web3.approvals);
    const [selectedApprovals, setSelectedApprovals] = useState([]);

    // Initialize provider and setup debugging
    useEffect(() => {
        // Initialize the provider service
        console.log("🔄 Initializing provider service...");
        initializeProvider().then(() => {
            console.log("✅ Provider service initialized");
        }).catch(error => {
            console.error("❌ Provider initialization error:", error);
        });

        // Setup Redux debugging
        if (typeof window !== 'undefined') {
            // Expose Redux store to window
            if (window.store) {
                console.log("📊 Redux store already exposed to window");
            } else {
                window.store = require('./store/index').default;
                console.log("📊 Redux store exposed to window");
            }
            
            // Create debug helper
            window.debugApp = {
                getState: () => window.store ? window.store.getState() : "Store not available",
                logState: () => {
                    if (window.store) {
                        const state = window.store.getState();
                        console.log("Current Redux State:", state);
                        return state;
                    }
                    return "Store not available";
                }
            };
            
            console.log("🛠️ Debug tools setup complete. Try window.debugApp.logState() in console");
        }
    }, []);

    // Log wallet and network changes
    useEffect(() => {
        console.log("👛 Wallet:", wallet);
        console.log("🌐 Network:", network);
    }, [wallet, network]);

    // Log approvals when they change
    useEffect(() => {
        console.log("📋 Approvals updated:", approvals);
        console.log("📋 Total approvals:", approvals.length);
    }, [approvals]);

    // Toggle approval selection for batch revoke
    const toggleApprovalSelection = (approval) => {
        console.log("🔄 Toggling approval selection:", approval);
        
        setSelectedApprovals((prev) => {
            const isSelected = prev.some((a) => a.id === approval.id);
            
            const updated = isSelected
                ? prev.filter((a) => a.id !== approval.id) // Remove if already selected
                : [...prev, approval]; // Add if not selected

            console.log("✅ Updated selected approvals:", updated);
            console.log("✅ Total selected:", updated.length);
            return updated;
        });
    };

    console.log("🔄 App render with wallet:", wallet ? "Connected" : "Not connected");

    return (
        <BootstrapWrapper>
            <div className="container my-5">
                {/* Header Section */}
                <header className="mb-4 text-center">
                    <h1 className="text-primary fw-bold">
                        <span className="me-2">🔒</span> Approval Manager
                    </h1>
                    <p className="text-muted">Review and revoke token approvals to protect your assets.</p>
                </header>

                {/* Connection Section */}
                <div className="row mb-4">
                    <div className="col-md-6">
                        <WalletConnect />
                    </div>
                    <div className="col-md-6">
                        <NetworkSelector />
                        <ApprovalDebugger />
                    </div>
                </div>

                {/* Main Content */}
                {!wallet ? (
                    <div className="text-center py-5">
                        <h2>Connect Your Wallet</h2>
                        <p className="text-muted">View and manage your active token approvals.</p>
                        <div className="card mx-auto" style={{ maxWidth: "550px" }}>
                            <div className="card-body">
                                <h5 className="card-title">Why use Approval Manager?</h5>
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
                    <div className="row mt-4">
                        <div className="col-lg-12">
                            <ExistingApprovals onToggleSelect={toggleApprovalSelection} />
                        </div>
                        
                        {selectedApprovals.length > 0 && (
                            <div className="col-lg-12 mt-3">
                                <BatchRevoke 
                                    selectedApprovals={selectedApprovals} 
                                    setSelectedApprovals={setSelectedApprovals} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-5 pt-4 border-top text-center text-muted">
                    <p><small>Mini Revoke Cash &copy; 2025</small></p>
                </footer>
            </div>
        </BootstrapWrapper>
    );
};

export default App;

