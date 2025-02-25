import { configureStore } from "@reduxjs/toolkit";
import web3Reducer from "./web3Slice";

const store = configureStore({
  reducer: {
    web3: web3Reducer,
  },
  devTools: true, // ✅ Ensure DevTools are enabled
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // ✅ Prevent Redux from blocking unserializable state
    }),
});

// 🔥 Expose Redux store for debugging
window.reduxStore = store;

export default store;
