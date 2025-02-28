import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Provider } from "react-redux"; // ✅ Import Provider
import store from "./store/index"; // ✅ Import Redux store

import WalletConnect from "./components/WalletConnect.js";
import NetworkSelector from "./components/NetworkSelector.js";
import ExistingApprovals from "./components/ExistingApprovals.js";
import BatchRevoke from "./components/BatchRevoke.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { BootstrapWrapper } from "./utils/provider";
import ApprovalDebugger from "./components/ApprovalDebugger";
import { initializeProvider } from "./utils/providerService";
import { ethers } from "ethers";

console.log("🔴 App.js loaded - " + new Date().toISOString());

const App = () => {
    console.log("🔶 App component rendering");
    const dispatch = useDispatch();
    const wallet = useSelector((state) => state.web3.account);
    const network = useSelector((state) => state.web3.network);
    const approvals = useSelector((state) => state.web3.approvals);
    const [selectedApprovals, setSelectedApprovals] = useState([]);

    useEffect(() => {
        console.log("🔄 Initializing provider service...");
        initializeProvider().then(() => {
            console.log("✅ Provider service initialized");
        }).catch(error => {
            console.error("❌ Provider initialization error:", error);
        });

        if (typeof window !== 'undefined') {
            if (!window.store) {
                window.store = store;
                console.log("📊 Redux store exposed to window");
            }
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

    useEffect(() => {
        console.log("👛 Wallet:", wallet);
        console.log("🌐 Network:", network);
    }, [wallet, network]);

    useEffect(() => {
        console.log("📋 Approvals updated:", approvals);
        console.log("📋 Total approvals:", approvals.length);
    }, [approvals]);

    return (
        <Provider store={store}>  {/* 🔥 Wrap the entire app with Redux Provider */}
            <BootstrapWrapper>
                <div className="container my-5">
                    <header className="mb-4 text-center">
                        <h1 className="text-primary fw-bold">
                            <span className="me-2">🔒</span> Approval Manager
                        </h1>
                        <p className="text-muted">Review and revoke token approvals to protect your assets.</p>
                    </header>

                    <div className="row mb-4">
                        <div className="col-md-6">
                            <WalletConnect />
                        </div>
                        <div className="col-md-6">
                            <NetworkSelector />
                            <ApprovalDebugger />
                        </div>
                    </div>

                    {!wallet ? (
                        <div className="text-center py-5">
                            <h2>Connect Your Wallet</h2>
                            <p className="text-muted">View and manage your active token approvals.</p>
                        </div>
                    ) : (
                        <div className="row mt-4">
                            <div className="col-lg-12">
                                <ExistingApprovals />
                            </div>
                            <div className="col-lg-12 mt-3">
                                <BatchRevoke />
                            </div>
                        </div>
                    )}
                </div>
            </BootstrapWrapper>
        </Provider>
    );
};

export default App;
