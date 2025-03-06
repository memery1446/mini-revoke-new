import React from "react";
import ReactDOM from "react-dom/client";  
import { BootstrapWrapper } from "./utils/provider";  
import { Provider } from "react-redux";
import store from "./store/index"; 
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";  
import { ethers } from "ethers";

// Log when the file loads
console.log("🚀 Root index.js loaded - " + new Date().toISOString());

// Make ethers available globally 
if (typeof window !== 'undefined') {
  window.ethers = ethers;
  console.log("🟢 window.ethers is now available in root index.js!");
  
  // Expose Redux store to window object
  if (!window.store) {
    window.store = store;
    console.log("📊 Redux store exposed to window from root index.js");
  } else {
    console.log("📊 Redux store already exposed to window");
  }
  
  // Enhanced debugging helpers
  window.debugApp = {
    getState: () => store.getState(),
    logState: () => {
      const state = store.getState();
      console.log("Current Redux State:", state);
      return state;
    },
    dispatch: store.dispatch
  };
  
  // Log initial state for verification
  console.log("🔍 Initial Redux State:", store.getState());
  
  // Subscribe to store updates
  const unsubscribe = store.subscribe(() => {
    console.log("🔄 Redux State Updated:", store.getState());
  });
  
  // Log helpful message about available commands
  console.log(
    "%c Redux Store Available in Console! \n" + 
    "%c Try these commands: \n" +
    "• window.store.getState() \n" +
    "• window.debugApp.logState() \n" +
    "• window.store.dispatch({ type: 'web3/setAccount', payload: '0x123...' })",
    "font-size: 14px; font-weight: bold; color: #4CAF50;",
    "font-size: 13px; color: #2196F3;"
  );
}

// Create React root and render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <BootstrapWrapper>
      <App />
    </BootstrapWrapper>
  </Provider>
);

