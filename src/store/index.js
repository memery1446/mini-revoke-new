console.log("🚀 store/index.js loaded successfully!"); // Debugging

import { ethers } from "ethers";
import { configureStore } from "@reduxjs/toolkit";
import web3Reducer from "./web3Slice";

// 🔥 Make ethers available globally with safety check
if (typeof window !== 'undefined') {
  window.ethers = ethers; 
  console.log("🟢 window.ethers is now available!", window.ethers);
}

const store = configureStore({
  reducer: {
    web3: web3Reducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// ✅ Immediately expose store with safety check
if (typeof window !== 'undefined') {
  window.store = store;
  console.log("📊 Redux store exposed as window.store", window.store);
  console.log("🔍 Initial Redux State:", store.getState());

  // ✅ Enhanced Debugging Helper
  window.debugApp = {
    getState: () => store.getState(),
    logState: () => {
      const state = store.getState();
      console.log("Current Redux State:", state);
      return state;
    },
    dispatch: store.dispatch, // Add direct dispatch access
  };

  // ✅ Subscribe to store updates
  store.subscribe(() => {
    console.log("🔄 Redux State Updated:", store.getState());
  });
  
  // Log a helpful message about available commands
  console.log(
    "%c Redux Debugging Tools Available: \n" + 
    "%c • window.store.getState() - Get current state\n" +
    "• window.debugApp.logState() - Log current state\n" +
    "• window.store.dispatch({type: 'web3/setAccount', payload: '0x123'}) - Dispatch action",
    "font-size: 14px; font-weight: bold; color: #4CAF50;",
    "font-size: 13px; color: #2196F3;"
  );
}

export default store;