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
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.store = store;
  console.log("📊 Redux store exposed as window.store");
  
  // Subscribe to store changes for debugging
  store.subscribe(() => {
    console.log("🔄 Redux State Updated:", store.getState());
  });
}

export default store;

