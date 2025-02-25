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
setApprovals: (state, action) => {
  state.approvals = action.payload;
},
    resetWeb3: (state) => {
      state.account = null;
      state.network = null;
      state.approvals = [];
    },
addApproval: (state, action) => {
  const index = state.approvals.findIndex(
    (a) => a.contract === action.payload.contract && a.spender === action.payload.spender
  );
  if (index !== -1) {
    state.approvals[index] = action.payload;
  } else {
    state.approvals.push(action.payload);
  }
},
removeApproval: (state, action) => {
  state.approvals = state.approvals.filter(
    (approval) =>
      !(approval.contract === action.payload.contract && approval.spender === action.payload.spender)
  );
},
  },
});

export const { setAccount, setNetwork, resetWeb3, addApproval, removeApproval } = web3Slice.actions;
export default web3Slice.reducer;
