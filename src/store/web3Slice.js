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
  state.account = action.payload; // ✅ Keep wallet as a string
},
setNetwork: (state, action) => {
  state.network = parseInt(action.payload, 10);  // ✅ Ensure it's always a number
},
resetWeb3: (state) => {
    console.log("🛑 Resetting Web3 State");
    state.account = null;
    state.network = null;
    // ❌ Do NOT reset approvals here
    // state.approvals = [];
},
addApproval: (state, action) => {
    console.log("🚀 Attempting to Add Approval:", action.payload);

    const exists = state.approvals.find(
        (a) => a.token === action.payload.token && a.spender === action.payload.spender
    );

    if (!exists) {
        state.approvals.push(action.payload);
        console.log("✅ Approval Added to Redux:", action.payload);
    } else {
        console.log("⚠️ Approval Already Exists in Redux:", action.payload);
    }

    console.log("🟢 Redux Approvals After Add:", state.approvals);
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
