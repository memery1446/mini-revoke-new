import React, { useEffect, useState, useRef } from "react";
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
  const debugRef = useRef(null);

  // Log when component renders (safely)
  safeConsoleLog("🔵 WalletConnect component rendering");
  
  // Create debug element
  useEffect(() => {
    try {
      // Create a visible debug element
      const debugElement = document.createElement('div');
      debugElement.id = 'wallet-debug';
      debugElement.style.position = 'fixed';
      debugElement.style.top = '10px';
      debugElement.style.left = '10px';
      debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      debugElement.style.color = 'white';
      debugElement.style.padding = '10px';
      debugElement.style.zIndex = '9999';
      debugElement.style.fontSize = '12px';
      debugElement.style.maxWidth = '300px';
      debugElement.style.maxHeight = '200px';
      debugElement.style.overflow = 'auto';
      debugElement.style.borderRadius = '5px';
      document.body.appendChild(debugElement);
      debugRef.current = debugElement;
      
      // Define update function
      const updateDebug = (msg) => {
        try {
          const el = document.getElementById('wallet-debug');
          if (el) {
            const entry = document.createElement('div');
            entry.textContent = `${new Date().toLocaleTimeString()}: ${msg}`;
            el.appendChild(entry);
            el.scrollTop = el.scrollHeight;
          }
          safeConsoleLog(msg);
        } catch (error) {
          safeConsoleLog("Debug update error:", error);
        }
      };
      
      // Set safe global reference (using a getter to avoid direct assignment)
      Object.defineProperty(window, '_updateDebug', {
        get: () => updateDebug,
        configurable: true
      });
      
      updateDebug("WalletConnect mounted");
    } catch (err) {
      safeConsoleLog("Debug setup error:", err);
    }
    
    // Clean up on unmount
    return () => {
      try {
        if (debugRef.current && document.body.contains(debugRef.current)) {
          document.body.removeChild(debugRef.current);
        }
        
        // Clean up global reference safely
        if (Object.getOwnPropertyDescriptor(window, '_updateDebug')) {
          Object.defineProperty(window, '_updateDebug', {
            value: null,
            configurable: true
          });
        }
      } catch (err) {
        safeConsoleLog("Debug cleanup error:", err);
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      window._updateDebug?.("Connect button clicked");
      safeConsoleLog("🔌 Connect button clicked");
      
      setConnecting(true);
      setError(null);
      
      // Use the connectWallet function from providerService
      const success = await connectWallet();
      
      window._updateDebug?.(`Wallet connection ${success ? "successful" : "failed"}`);
      
      if (!success) {
        setError("Failed to connect wallet");
        window._updateDebug?.("❌ Wallet connection failed");
      }
    } catch (err) {
      safeConsoleLog("❌ Wallet connection error:", err);
      window._updateDebug?.(`Error: ${err.message || "Unknown connection error"}`);
      setError(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      window._updateDebug?.("Disconnecting wallet");
      dispatch(setAccount(null));
    } catch (err) {
      safeConsoleLog("Disconnect error:", err);
    }
  };

  // Log when account changes
  useEffect(() => {
    try {
      window._updateDebug?.(`Account state: ${account || "not connected"}`);
      safeConsoleLog("👛 Account state updated:", account);
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
          <p>Debug: {connecting ? "Connecting..." : account ? "Connected" : "Not connected"}</p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;

