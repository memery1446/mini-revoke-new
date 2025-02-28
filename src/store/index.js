console.log("🚀 store/index.js loaded successfully!"); // Debugging

import { ethers } from "ethers";
window.ethers = ethers; // 🔥 Make ethers available globally
console.log("🟢 window.ethers is now available!", window.ethers);

import { configureStore } from "@reduxjs/toolkit";
import web3Reducer from "./web3Slice";

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

// ✅ Immediately expose store
window.store = store;
console.log("📊 Redux store exposed as window.store", window.store);
console.log("🔍 Initial Redux State:", store.getState());

// ✅ Debugging Helper
window.debugApp = {
  getState: () => store.getState(),
  logState: () => {
    const state = store.getState();
    console.log("Current Redux State:", state);
    return state;
  },
};

// ✅ Subscribe to store updates
store.subscribe(() => {
  console.log("🔄 Redux State Updated:", store.getState());
});

export default store;
