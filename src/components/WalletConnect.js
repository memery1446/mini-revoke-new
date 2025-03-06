import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAccount } from "../store/web3Slice";
import { connectWallet } from "../utils/providerService";

// Force direct console access - bypass any potential overwrites
const safeConsoleLog = window.console.log.bind(window.console);

const WalletConnect = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3?.account);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Log when component renders (safely)
  useEffect(() => {
    safeConsoleLog("🔵 WalletConnect component mounted");
    
    // Remove any existing debug elements that might be left over
    try {
      const existingDebug = document.getElementById('wallet-debug');
      if (existingDebug && document.body.contains(existingDebug)) {
        document.body.removeChild(existingDebug);
      }
      
      // Clean up global reference if it exists
      if (window._updateDebug) {
        window._updateDebug = null;
        delete window._updateDebug;
      }
    } catch (err) {
      // Silently handle any cleanup errors
    }
    
    return () => {
      safeConsoleLog("🔵 WalletConnect component unmounted");
    };
  }, []);

  const handleConnect = async () => {
    try {
      safeConsoleLog("🔌 Connect button clicked");
      
      setConnecting(true);
      setError(null);
      
      // Use the connectWallet function from providerService
      const success = await connectWallet();
      
      safeConsoleLog(`Wallet connection ${success ? "successful" : "failed"}`);
      
      if (!success) {
        setError("Failed to connect wallet");
        safeConsoleLog("❌ Wallet connection failed");
      }
    } catch (err) {
      safeConsoleLog("❌ Wallet connection error:", err);
      setError(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      safeConsoleLog("Disconnecting wallet");
      dispatch(setAccount(null));
    } catch (err) {
      safeConsoleLog("Disconnect error:", err);
    }
  };

  // Log when account changes
  useEffect(() => {
    try {
      safeConsoleLog("👛 Account state updated:", account || "not connected");
    } catch (err) {
      safeConsoleLog("Account update error:", err);
    }
  }, [account]);

  // Render safely
  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">Wallet Connection</h5>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {!account ? (
          <button 
            className="btn btn-primary w-100" 
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div>
            <div className="alert alert-success">
              <strong>Connected:</strong> {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </div>
            <button 
              className="btn btn-outline-secondary w-100 mt-2"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        )}
        
        <div className="mt-3 text-muted small">
          <p>Status: {connecting ? "Connecting..." : account ? "Connected" : "Not connected"}</p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;

