// This is a suggestion for your WalletConnect.js component with enhanced console logging

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAccount } from "../store/web3Slice";
import { ethers } from "ethers";

const WalletConnect = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);

  // Function to handle wallet connection
  const connectWallet = async () => {
    console.log("🔌 Attempting to connect wallet...");
    try {
      if (window.ethereum) {
        console.log("🦊 MetaMask detected");
        
        // Request account access
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("📋 Accounts returned:", accounts);
        
        if (accounts && accounts.length > 0) {
          const currentAccount = accounts[0];
          console.log(`✅ Connected to account: ${currentAccount}`);
          
          // Dispatch the account to Redux
          dispatch(setAccount(currentAccount));
          console.log("📊 Account dispatched to Redux");
          
          // Log the current Redux state after dispatch
          if (window.store) {
            console.log("🔍 Redux state after wallet connection:", window.store.getState());
          }
          
          return currentAccount;
        } else {
          console.warn("⚠️ No accounts found after connection attempt");
          return null;
        }
      } else {
        console.error("❌ No Ethereum provider (MetaMask) detected");
        alert("Please install MetaMask to connect your wallet");
        return null;
      }
    } catch (error) {
      console.error("❌ Wallet connection error:", error);
      if (error.code === 4001) {
        console.log("🚫 User rejected the connection request");
      }
      return null;
    }
  };

  // Setup event listeners for wallet changes
  useEffect(() => {
    const setupWalletEvents = async () => {
      if (window.ethereum) {
        console.log("🔄 Setting up wallet event listeners");
        
        // Handle account changes
        window.ethereum.on("accountsChanged", (accounts) => {
          console.log("👛 Wallet accounts changed:", accounts);
          if (accounts.length === 0) {
            console.log("🔒 User disconnected wallet");
            dispatch(setAccount(null));
          } else {
            console.log(`🔁 Switched to account: ${accounts[0]}`);
            dispatch(setAccount(accounts[0]));
          }
          
          // Log the Redux state after account change
          if (window.store) {
            console.log("🔍 Redux state after account change:", window.store.getState());
          }
        });

        // Handle chain/network changes
        window.ethereum.on("chainChanged", (chainId) => {
          console.log(`⛓️ Chain changed to: ${chainId}`);
          // Log the Redux state after chain change
          if (window.store) {
            console.log("🔍 Redux state after chain change:", window.store.getState());
          }
          window.location.reload(); // Refresh the page on chain change
        });
        
        // Auto-connect if previously connected
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            console.log(`🔄 Auto-connecting to previously connected account: ${accounts[0]}`);
            dispatch(setAccount(accounts[0]));
            
            // Log the Redux state after auto-connection
            if (window.store) {
              console.log("🔍 Redux state after auto-connection:", window.store.getState());
            }
          }
        } catch (error) {
          console.error("❌ Error during auto-connect:", error);
        }
      }
    };
    
    setupWalletEvents();
    
    // Cleanup function
    return () => {
      if (window.ethereum) {
        console.log("🧹 Removing wallet event listeners");
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, [dispatch]);

  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">Wallet</h5>
        
        {!account ? (
          <button 
            className="btn btn-primary w-100" 
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        ) : (
          <div>
            <div className="alert alert-success">
              <strong>Connected:</strong> {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </div>
            <button 
              className="btn btn-outline-secondary w-100 mt-2"
              onClick={() => {
                console.log("🔌 Manually disconnecting wallet");
                dispatch(setAccount(null));
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnect;
