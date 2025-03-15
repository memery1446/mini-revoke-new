// Minimal Redux slice for testing
import { createSlice } from "@reduxjs/toolkit";

const minimalWeb3Slice = createSlice({
  name: "web3",
  initialState: {
    account: null,
    network: null,
    approvals: [], // Always initialize as an empty array
    lastUpdated: new Date().toISOString()
  },
  reducers: {
    // Simplified setApprovals that just replaces the array
    setApprovals: (state, action) => {
      console.log("🔄 MinimalRedux: setApprovals called");
      console.log("📥 Payload:", action.payload);
      
      // Very robust validation and handling
      if (!action.payload) {
        console.warn("⚠️ Empty payload received, setting empty array");
        state.approvals = [];
      }
      else if (!Array.isArray(action.payload)) {
        console.warn("⚠️ Non-array payload received, wrapping in array");
        state.approvals = [action.payload];
      } 
      else {
        state.approvals = action.payload; // Simple direct assignment
      }
      
      // Update timestamp
      state.lastUpdated = new Date().toISOString();
      
      console.log("✅ New approvals state:", state.approvals);
    },
    
    // Simplified account setter
    setAccount: (state, action) => {
      state.account = action.payload;
      console.log("👛 Account set:", action.payload);
    },
    
    // Simplified network setter
    setNetwork: (state, action) => {
      state.network = action.payload;
      console.log("🌐 Network set:", action.payload);
    }
  }
});

export const { setApprovals, setAccount, setNetwork } = minimalWeb3Slice.actions;
export default minimalWeb3Slice.reducer;











// // import { createSlice } from "@reduxjs/toolkit";

// // Helper to ensure array type
// const ensureArray = (input) => {
//   if (!input) return [];
//   return Array.isArray(input) ? input : [input];
// };

// const web3Slice = createSlice({
//   name: "web3",
//   initialState: {
//     account: null,
//     network: null,
//     approvals: [], // Ensure this is always an array
//     lastUpdated: null, // Add timestamp for debugging
//   },
//   reducers: {
//     setAccount: (state, action) => {
//       state.account = action.payload; // Keep wallet as a string
//       console.log("👛 Account set:", action.payload); // Add logging for easier debugging
//     },
//     setNetwork: (state, action) => {
//       state.network = Number.parseInt(action.payload, 10) || null; // Ensure it's always a number or null if parsing fails
//       console.log("🌐 Network set:", state.network); // Add logging for easier debugging
//     },
//     setApprovals: (state, action) => {
//       console.log("🔄 Redux: Approvals BEFORE update:", state.approvals.length);
//       console.log("📥 Incoming Approvals Payload:", action.payload);

//       // Enhanced validation
//       if (!action.payload) {
//         console.error("❌ Empty approvals data received");
//         return;
//       }

//       // Ensure we have an array
//       const approvalsArray = ensureArray(action.payload);
      
//       // Further validation
//       if (!approvalsArray.length) {
//         console.warn("⚠️ Setting empty approvals array");
//       }

//       // Check for malformed entries
//       const validApprovals = approvalsArray.filter(item => {
//         if (!item || typeof item !== 'object') {
//           console.error("❌ Invalid approval item (not an object):", item);
//           return false;
//         }
//         if (!item.contract || !item.spender) {
//           console.error("❌ Invalid approval item (missing contract or spender):", item);
//           return false;
//         }
//         return true;
//       });

//       // Update with validated array and timestamp
//       state.approvals = validApprovals;
//       state.lastUpdated = new Date().toISOString();
      
//       console.log("✅ Redux: Approvals AFTER update:", state.approvals.length);
//     },

//     resetWeb3: (state) => {
//       console.log("🛑 Resetting Web3 State");
//       state.account = null;
//       state.network = null;
//       state.approvals = []; // Reset to an empty array
//       state.lastUpdated = new Date().toISOString();
//     },
    
//     addApproval: (state, action) => {
//       console.log("🚀 Attempting to Add Approval:", action.payload);
//       if (!action.payload || !action.payload.contract || !action.payload.spender) {
//         console.error("❌ Invalid approval data:", action.payload);
//         return;
//       }
      
//       // Ensure approvals is an array
//       if (!Array.isArray(state.approvals)) {
//         console.warn("⚠️ state.approvals is not an array, initializing it");
//         state.approvals = [];
//       }
      
//       const index = state.approvals.findIndex(
//         (a) => a.contract === action.payload.contract && a.spender === action.payload.spender
//       );
//       if (index !== -1) {
//         state.approvals[index] = action.payload;
//         console.log("✅ Approval Updated in Redux:", action.payload);
//       } else {
//         state.approvals.push(action.payload);
//         console.log("✅ New Approval Added to Redux:", action.payload);
//       }
      
//       state.lastUpdated = new Date().toISOString();
//     },
    
//     removeApproval: (state, action) => {
//       if (!action.payload || !action.payload.contract || !action.payload.spender) {
//         console.error("❌ Invalid approval data for removal:", action.payload);
//         return;
//       }
      
//       // Ensure approvals is an array
//       if (!Array.isArray(state.approvals)) {
//         console.warn("⚠️ state.approvals is not an array, initializing it");
//         state.approvals = [];
//         return;
//       }
      
//       const initialLength = state.approvals.length;
//       state.approvals = state.approvals.filter(
//         (approval) => !(approval.contract === action.payload.contract && approval.spender === action.payload.spender)
//       );
      
//       const removed = initialLength - state.approvals.length;
//       console.log(`🗑️ Removed ${removed} approval(s) from Redux:`, action.payload);
      
//       state.lastUpdated = new Date().toISOString();
//     },
//   },
// });

// // Expose actions to window for debugging
// if (typeof window !== 'undefined') {
//   window.web3Actions = web3Slice.actions;
//   console.log("🛠️ Redux actions exposed as window.web3Actions");
// }

// export const { setAccount, setNetwork, setApprovals, resetWeb3, addApproval, removeApproval } = web3Slice.actions;

// export default web3Slice.reducer;

