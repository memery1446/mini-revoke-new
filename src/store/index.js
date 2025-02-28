console.log("🚀 store/index.js loaded successfully!"); // Debugging

import { ethers } from "ethers";
window.ethers = ethers; // 🔥 This makes it accessible in the browser console
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

// Expose store to window for debugging
if (typeof window !== 'undefined') {
  window.store = store;
  console.log("📊 Redux store exposed as window.store");
  
  store.subscribe(() => {
    console.log("🔄 Redux State:", store.getState());
  });
}

export default store;
