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
}

export default store;

