import { createSlice } from "@reduxjs/toolkit";

const web3Slice = createSlice({
  name: "web3",
  initialState: {
    account: null,
    network: null,
    approvals: [], // Ensure this is always an array
  },
  reducers: {
    setAccount: (state, action) => {
      state.account = action.payload; // Keep wallet as a string
      console.log("👛 Account set:", action.payload); // Add logging for easier debugging
    },
    setNetwork: (state, action) => {
      state.network = Number.parseInt(action.payload, 10) || null; // Ensure it's always a number or null if parsing fails
      console.log("🌐 Network set:", state.network); // Add logging for easier debugging
    },
setApprovals: (state, action) => {
  console.log("🔄 Redux: Approvals BEFORE update:", state.approvals);
  console.log("📥 Incoming Approvals Payload:", action.payload);

  if (!action.payload || !Array.isArray(action.payload)) {
    console.error("❌ Invalid approvals data:", action.payload);
    return;
  }

  state.approvals = [...action.payload]; // Ensure fresh reference
  console.log("✅ Redux: Approvals AFTER update:", state.approvals);
},

    resetWeb3: (state) => {
      console.log("🛑 Resetting Web3 State");
      state.account = null;
      state.network = null;
      state.approvals = []; // Reset to an empty array
    },
    addApproval: (state, action) => {
      console.log("🚀 Attempting to Add Approval:", action.payload);
      if (!action.payload || !action.payload.contract || !action.payload.spender) {
        console.error("❌ Invalid approval data:", action.payload);
        return;
      }
      
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
      if (!action.payload || !action.payload.contract || !action.payload.spender) {
        console.error("❌ Invalid approval data for removal:", action.payload);
        return;
      }
      
      state.approvals = state.approvals.filter(
        (approval) => !(approval.contract === action.payload.contract && approval.spender === action.payload.spender)
      );
      console.log("🗑️ Approval Removed from Redux:", action.payload);
    },
  },
});

// Expose actions to window for debugging
if (typeof window !== 'undefined') {
  window.web3Actions = web3Slice.actions;
  console.log("🛠️ Redux actions exposed as window.web3Actions");
}

export const { setAccount, setNetwork, setApprovals, resetWeb3, addApproval, removeApproval } = web3Slice.actions;

export default web3Slice.reducer;

