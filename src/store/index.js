import { configureStore } from "@reduxjs/toolkit";
import web3Reducer from "./web3Slice"; // ✅ Correct import

const store = configureStore({
  reducer: {
    web3: web3Reducer,
  },
  devTools: process.env.NODE_ENV !== "production", // ✅ Enable Redux DevTools
});

// 🔥 Expose Redux store globally for debugging
window.reduxStore = store;

export default store;
