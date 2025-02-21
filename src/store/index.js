import { configureStore } from "@reduxjs/toolkit";
import web3Reducer from "./web3Slice";

const store = configureStore({
  reducer: {
    web3: web3Reducer,
  },
});

export default store;

