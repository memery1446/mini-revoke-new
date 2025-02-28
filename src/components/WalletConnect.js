import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAccount } from "../store/web3Slice";
import { connectWallet } from "../utils/providerService";

// Force direct console access - bypass any potential overwrites
const safeConsoleLog = window.console.log.bind(window.console);

const WalletConnect = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Log when component renders
  safeConsoleLog("🔵 WalletConnect component rendering");
  
  useEffect(() => {
    // Create a visible debug element
    const debugElement = document.createElement('div');
    debugElement.id = 'wallet-debug';
    debugElement.style.position = 'fixed';
    debugElement.style.top = '10px';
    debugElement.style.left = '10px';
    debugElement.style.backgroundColor = 'black';
    debugElement.style.color = 'white';
    debugElement.style.padding = '10px';
    debugElement.style.zIndex = '9999';
    debugElement.style.fontSize = '12px';
    debugElement.style.maxWidth = '300px';
    debugElement.style.maxHeight = '200px';
    debugElement.style.overflow = 'auto';
    document.body.appendChild(debugElement);
    
    function updateDebug(msg) {
      const el = document.getElementById('wallet-debug');
      if (el) {
        el.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${msg}</div>`;
        el.scrollTop = el.scrollHeight;
      }
      safeConsoleLog(msg);
    }
    
    updateDebug("WalletConnect mounted");
    window._updateDebug = updateDebug; // Expose globally
    
    return () => {
      const el = document.getElementById('wallet-debug');
      if (el) el.remove();
    };
  }, []);

  const handleConnect = async () => {
    window._updateDebug?.("Connect button clicked");
    safeConsoleLog("🔌 Connect button clicked");
    
    setConnecting(true);
    setError(null);
    
    try {
      window._updateDebug?.("Attempting to connect wallet...");
      
      // Use the connectWallet function from providerService
      const success = await connectWallet();
      
      window._updateDebug?.(`Wallet connection ${success ? "successful" : "failed"}`);
      
      if (!success) {
        setError("Failed to connect wallet");
        window._updateDebug?.("❌ Wallet connection failed");
      }
    } catch (err) {
      safeConsoleLog("❌ Wallet connection error:", err);
      window._updateDebug?.(`Error: ${err.message}`);
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    window._updateDebug?.("Disconnecting wallet");
    dispatch(setAccount(null));
  };

  // Log when account changes
  useEffect(() => {
    window._updateDebug?.(`Account state: ${account || "not connected"}`);
    safeConsoleLog("👛 Account state updated:", account);
  }, [account]);

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
          <p>Debug: {connecting ? "Connecting..." : account ? "Connected" : "Not connected"}</p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
