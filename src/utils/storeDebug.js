// utils/storeDebug.js

console.log("🛠️ storeDebug.js loaded - " + new Date().toISOString());

// Function to check if the Redux store is properly set up
export const checkReduxStore = () => {
  console.log("🔍 Checking Redux store status...");
  
  if (typeof window === 'undefined') {
    console.log("⚠️ Running in a non-browser environment");
    return false;
  }
  
  // Check for Redux DevTools
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log("✅ Redux DevTools extension detected");
  } else {
    console.warn("⚠️ Redux DevTools extension not found. Consider installing for better debugging");
  }
  
  // Check for store
  if (window.store) {
    console.log("✅ Redux store found on window.store");
    console.log("📊 Current state:", window.store.getState());
    
    // Test dispatch an action
    try {
      window.store.dispatch({ type: "debug/checkStore", payload: Date.now() });
      console.log("✅ Store dispatch test successful");
    } catch (error) {
      console.error("❌ Store dispatch test failed:", error);
    }
    
    return true;
  } else {
    console.error("❌ Redux store not found on window.store");
    return false;
  }
};

// Setup enhanced console logging
export const setupEnhancedLogging = () => {
  // Store original console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Enhance console.log
  console.log = function(...args) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    originalLog.apply(console, [`[${timestamp}]`, ...args]);
  };
  
  // Enhance console.warn
  console.warn = function(...args) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    originalWarn.apply(console, [`[${timestamp}] ⚠️`, ...args]);
  };
  
  // Enhance console.error
  console.error = function(...args) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    originalError.apply(console, [`[${timestamp}] ❌`, ...args]);
  };
  
  console.log("✅ Enhanced console logging activated");
};

// Function to monitor Redux state changes
export const monitorReduxState = () => {
  if (typeof window === 'undefined' || !window.store) {
    console.error("❌ Cannot monitor Redux state - store not available");
    return;
  }
  
  let previousState = JSON.stringify(window.store.getState());
  
  // Set up an interval to check for state changes
  const intervalId = setInterval(() => {
    const currentState = JSON.stringify(window.store.getState());
    
    if (previousState !== currentState) {
      console.log("🔄 Redux state changed");
      console.log("New state:", window.store.getState());
      previousState = currentState;
    }
  }, 1000); // Check every second
  
  console.log("🔍 Redux state monitoring activated");
  
  // Return a function to stop monitoring
  return () => {
    clearInterval(intervalId);
    console.log("🛑 Redux state monitoring stopped");
  };
};

// Initialize debug utils
export const initDebugUtils = () => {
  console.log("🚀 Initializing Redux debug utilities");
  setupEnhancedLogging();
  
  // Wait for window.store to be available
  const checkStoreInterval = setInterval(() => {
    if (window.store) {
      console.log("✅ Redux store found, setting up monitoring");
      checkReduxStore();
      monitorReduxState();
      clearInterval(checkStoreInterval);
    }
  }, 500);
  
  // Add global debug commands
  window.reduxDebug = {
    checkStore: checkReduxStore,
    logState: () => {
      if (window.store) {
        console.log("📊 Current Redux State:", JSON.stringify(window.store.getState(), null, 2));
        return window.store.getState();
      } else {
        console.error("❌ Redux store not available");
        return null;
      }
    },
    test: {
      connectWallet: async () => {
        console.log("🧪 Testing wallet connection");
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            console.log("✅ Test connection successful:", accounts);
            if (window.store) {
              window.store.dispatch({ type: "web3/setAccount", payload: accounts[0] });
              console.log("✅ Test dispatch successful");
            }
            return accounts;
          } catch (error) {
            console.error("❌ Test connection failed:", error);
          }
        } else {
          console.error("❌ No Ethereum provider found");
        }
      },
      resetState: () => {
        if (window.store) {
          window.store.dispatch({ type: "web3/resetWeb3" });
          console.log("🧹 Redux state reset");
        }
      }
    }
  };
  
  console.log(
    "%c Redux Debug Utils Ready! \n" + 
    "%c Try these commands: \n" +
    "• window.reduxDebug.checkStore() \n" +
    "• window.reduxDebug.logState() \n" +
    "• window.reduxDebug.test.connectWallet() \n" +
    "• window.reduxDebug.test.resetState()",
    "font-size: 14px; font-weight: bold; color: #4CAF50;",
    "font-size: 13px; color: #2196F3;"
  );
};

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'complete') {
    initDebugUtils();
  } else {
    window.addEventListener('load', initDebugUtils);
  }
}

export default { checkReduxStore, setupEnhancedLogging, monitorReduxState, initDebugUtils };

