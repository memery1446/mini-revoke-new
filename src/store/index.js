console.log("🚀 store/index.js loaded successfully! " + new Date().toISOString()); // Debugging with timestamp

import { ethers } from "ethers";
import { configureStore } from "@reduxjs/toolkit";
import web3Reducer from "./web3Slice";

// 🔥 Make ethers available globally with safety check
if (typeof window !== 'undefined') {
  window.ethers = ethers; 
  console.log("🟢 window.ethers is now available!", typeof window.ethers);
}

// Create a custom middleware to log all actions
const loggerMiddleware = store => next => action => {
  console.log('🎬 Dispatching action:', action.type, action.payload);
  const result = next(action);
  console.log('🔄 New state after action:', store.getState());
  return result;
};

// Configure store with logging
const store = configureStore({
  reducer: {
    web3: web3Reducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(loggerMiddleware),
});

console.log("🏗️ Redux store created successfully!");

// ✅ Immediately expose store with safety check
if (typeof window !== 'undefined') {
  window.store = store;
  console.log("📊 Redux store exposed as window.store", typeof window.store);
  console.log("🔍 Initial Redux State:", JSON.stringify(store.getState()));

  // ✅ Enhanced Debugging Helper with more tools
  window.debugApp = {
    getState: () => store.getState(),
    logState: () => {
      const state = store.getState();
      console.log("📋 Current Redux State:", JSON.stringify(state, null, 2));
      return state;
    },
    dispatch: (action) => {
      console.log("🚀 Manual dispatch:", action);
      return store.dispatch(action);
    },
    connect: async () => {
      console.log("🔌 Attempting manual wallet connection...");
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          if (accounts && accounts.length > 0) {
            store.dispatch({ type: 'web3/setAccount', payload: accounts[0] });
            console.log("✅ Manual connection successful:", accounts[0]);
            return accounts[0];
          }
        } else {
          console.error("❌ No Ethereum provider found");
        }
      } catch (error) {
        console.error("❌ Manual connection error:", error);
      }
    },
    testAction: (actionType) => {
      console.log(`🧪 Dispatching test action: ${actionType}`);
      switch(actionType) {
        case 'setAccount':
          store.dispatch({ type: 'web3/setAccount', payload: '0xTestAccount123456789' });
          break;
        case 'setNetwork':
          store.dispatch({ type: 'web3/setNetwork', payload: 1 });
          break;
        case 'reset':
          store.dispatch({ type: 'web3/resetWeb3' });
          break;
        default:
          console.log("❓ Unknown test action type");
      }
    }
  };

  // ✅ Subscribe to store updates with detailed logging
  const unsubscribe = store.subscribe(() => {
    const currentState = store.getState();
    console.log("🔄 Redux State Updated:", JSON.stringify(currentState, null, 2));
    
    // Log changes to specific slices
    if (currentState.web3) {
      console.log("👛 Web3 State:", {
        account: currentState.web3.account,
        network: currentState.web3.network,
        approvalsCount: Array.isArray(currentState.web3.approvals) ? currentState.web3.approvals.length : 'N/A'
      });
    }
  });
  
  // Print a message to clearly see in the console
  console.log(
    "%c 🚀 REDUX STORE READY FOR DEBUGGING \n" + 
    "%c Try these commands in the console: \n" +
    "• window.store.getState() - Get state\n" +
    "• window.debugApp.logState() - Pretty-print state\n" +
    "• window.debugApp.connect() - Manual wallet connect\n" +
    "• window.debugApp.testAction('setAccount') - Test an action\n" +
    "• window.debugApp.dispatch({ type: 'web3/setAccount', payload: '0x123' })",
    "font-size: 16px; font-weight: bold; color: #4CAF50; background: #f1f1f1; padding: 5px;",
    "font-size: 14px; color: #2196F3; background: #f9f9f9; padding: 5px;"
  );
}

// Final confirmation
console.log("✅ store/index.js initialization complete");

export default store;