import { createSlice } from "@reduxjs/toolkit";

const web3Slice = createSlice({
  name: "web3",
  initialState: {
    account: null,
    network: null,
    approvals: [],
  },
  reducers: {
    setAccount: (state, action) => {
      state.account = action.payload;
    },
    setNetwork: (state, action) => {
      state.network = action.payload;
    },
    resetWeb3: (state) => {
      state.account = null;
      state.network = null;
      state.approvals = [];
    },
    addApproval: (state, action) => {
      // Prevent duplicates
      const exists = state.approvals.find(
        (a) => a.token === action.payload.token && a.spender === action.payload.spender
      );
      if (!exists) {
        state.approvals.push(action.payload);
      }
    },
    removeApproval: (state, action) => {
      state.approvals = state.approvals.filter(
        (approval) =>
          !(approval.token === action.payload.token && approval.spender === action.payload.spender)
      );
    },
  },
});

export const { setAccount, setNetwork, resetWeb3, addApproval, removeApproval } = web3Slice.actions;
export default web3Slice.reducer;
