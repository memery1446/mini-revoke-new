import { createSlice } from "@reduxjs/toolkit";

const web3Slice = createSlice({
  name: "web3",
  initialState: {
    account: null,
    network: null,
    approvals: [], // ✅ Ensure this is always an array
  },
  reducers: {
    setAccount: (state, action) => {
      state.account = action.payload; // ✅ Keep wallet as a string
    },
    setNetwork: (state, action) => {
      state.network = Number.parseInt(action.payload, 10); // ✅ Ensure it's always a number
    },
    setApprovals: (state, action) => {
      state.approvals = action.payload || []; // ✅ Prevent undefined errors
      console.log("📋 Approvals Updated:", state.approvals);
    },
    resetWeb3: (state) => {
      console.log("🛑 Resetting Web3 State");
      state.account = null;
      state.network = null;
      state.approvals = []; // ✅ Reset to an empty array
    },
    addApproval: (state, action) => {
      console.log("🚀 Attempting to Add Approval:", action.payload);
      const index = state.approvals.findIndex(
        (a) => a.contract === action.payload.contract && a.spender === action.payload.spender
      );
      if (index !== -1) {
        state.approvals[index] = action.payload;
        console.log("✅ Approval Updated in Redux:", action.payload);
      } else {
        state.approvals.push(action.payload);
        console.log("✅ New Approval Added to Redux:", action.payload);
      }
    },
    removeApproval: (state, action) => {
      state.approvals = state.approvals.filter(
        (approval) => !(approval.contract === action.payload.contract && approval.spender === action.payload.spender)
      );
      console.log("🗑️ Approval Removed from Redux:", action.payload);
    },
  },
});

export const { setAccount, setNetwork, setApprovals, resetWeb3, addApproval, removeApproval } = web3Slice.actions;

export default web3Slice.reducer;
