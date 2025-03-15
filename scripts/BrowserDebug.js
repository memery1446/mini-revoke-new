// Copy and paste this in your browser console to debug the app

console.log("%c 🔍 Approval Manager Debug Tool", "font-size: 16px; font-weight: bold; color: #0066cc;");

// Clear any existing debug functions
window.debugApp = window.debugApp || {};

// ===== Provider Debugging =====
debugApp.testProvider = async () => {
  console.log("🔌 Testing providers...");
  
  // Check if we have a provider
  if (window.ethersProvider) {
    console.log("✅ Global ethersProvider found");
    
    try {
      const network = await window.ethersProvider.getNetwork();
      console.log(`✅ Connected to network ${network.chainId}`);
      
      const blockNumber = await window.ethersProvider.getBlockNumber();
      console.log(`✅ Current block: ${blockNumber}`);
      
      const signer = await window.ethersProvider.getSigner();
      console.log(`✅ Signer connected: ${await signer.getAddress()}`);
      
      return { provider: window.ethersProvider, success: true };
    } catch (err) {
      console.error("❌ ethersProvider error:", err);
    }
  } else {
    console.log("❌ No global ethersProvider found");
  }
  
  // Try importing provider service
  console.log("🔄 Trying providerService...");
  try {
    // This won't work in the console directly, but we can simulate it
    if (typeof getProvider === 'function') {
      const provider = await getProvider();
      console.log("✅ Provider from getProvider() function:", provider);
      return { provider, success: true };
    } else {
      console.log("❌ getProvider function not found in global scope");
    }
  } catch (err) {
    console.error("❌ Provider service error:", err);
  }
  
  return { success: false };
};

// ===== Redux Debugging =====
debugApp.logReduxState = () => {
  console.log("%c Redux State:", "font-weight: bold; color: green;");
  
  if (window.store) {
    const state = window.store.getState();
    console.log("Complete Redux State:", state);
    
    if (state.web3) {
      console.log("Account:", state.web3.account);
      console.log("Network:", state.web3.network);
      console.log("Approvals:", state.web3.approvals);
      console.log("Approvals count:", Array.isArray(state.web3.approvals) ? state.web3.approvals.length : 'Not an array');
    } else {
      console.log("❌ No web3 state found in Redux store");
    }
    
    return state;
  } else {
    console.log("❌ No Redux store found at window.store");
    return null;
  }
};

// ===== Mock Approval Data =====
debugApp.mockApprovals = [
  {
    type: 'ERC-20',
    contract: '0x6b175474e89094c44da98b954eedeac495271d0f',
    spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
    asset: 'DAI',
    valueAtRisk: 'Unlimited'
  },
  {
    type: 'ERC-721',
    contract: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    spender: '0x00000000006c3852cbef3e08e8df289169ede581',
    asset: 'BAYC',
    valueAtRisk: 'All NFTs'
  },
  {
    type: 'ERC-1155',
    contract: '0x495f947276749ce646f68ac8c248420045cb7b5e',
    spender: '0x207a32a58e1666f4109b361869b9456bf4761283',
    asset: 'OpenSea Collection',
    valueAtRisk: 'Multiple NFTs'
  }
];

// ===== Add Test Approvals =====
debugApp.addTestApprovals = () => {
  console.log("🚀 Adding test approvals to Redux...");
  
  if (window.store && typeof window.store.dispatch === 'function') {
    window.store.dispatch({ 
      type: 'web3/setApprovals', 
      payload: debugApp.mockApprovals
    });
    console.log("✅ Test approvals added to Redux");
    
    // Verify they were added
    setTimeout(() => {
      const state = window.store.getState();
      console.log("Approvals after adding:", state.web3.approvals);
    }, 100);
    
    return true;
  } else {
    console.log("❌ Cannot add test approvals - Redux store not found");
    return false;
  }
};

// ===== Debug Component Visibility =====
debugApp.checkComponentsVisible = () => {
  console.log("🔍 Checking if components are rendered...");
  
  // Check ApprovalDashboard
  const dashboardElements = document.querySelectorAll('.card-header');
  let approvalDashboardFound = false;
  
  dashboardElements.forEach(el => {
    if (el.textContent.includes('Token Approvals')) {
      approvalDashboardFound = true;
      console.log("✅ ApprovalDashboard component is rendered");
    }
  });
  
  if (!approvalDashboardFound) {
    console.log("❌ ApprovalDashboard component not found in DOM");
  }
  
  // Check ExistingApprovals
  let existingApprovalsFound = false;
  dashboardElements.forEach(el => {
    if (el.textContent.includes('Existing Approvals')) {
      existingApprovalsFound = true;
      console.log("✅ ExistingApprovals component is rendered");
    }
  });
  
  if (!existingApprovalsFound) {
    console.log("❌ ExistingApprovals component not found in DOM");
  }
  
  return {
    approvalDashboardVisible: approvalDashboardFound,
    existingApprovalsVisible: existingApprovalsFound
  };
};

// ===== Debug fetchApprovals Function =====
debugApp.debugFetchApprovals = async () => {
  console.log("🚀 Attempting to debug fetchApprovals function...");
  
  // First check if the function exists in any component
  let fetchApprovalsFunction = null;
  
  // Look through React component instances
  // This is a hack and may not work in all cases
  const reactInstances = [];
  const walk = (node) => {
    const reactKey = Object.keys(node).find(key => 
      key.startsWith('__reactFiber$') || 
      key.startsWith('__reactInternalInstance$')
    );
    
    if (reactKey) {
      let fiber = node[reactKey];
      if (fiber && fiber.memoizedProps) {
        reactInstances.push(fiber.memoizedProps);
      }
    }
    
    if (node.childNodes && node.childNodes.length) {
      for (let i = 0; i < node.childNodes.length; i++) {
        walk(node.childNodes[i]);
      }
    }
  };
  
  try {
    walk(document.body);
    console.log(`Found ${reactInstances.length} React component instances`);
    
    // Look for fetchApprovals
    for (const instance of reactInstances) {
      if (typeof instance.fetchApprovals === 'function') {
        fetchApprovalsFunction = instance.fetchApprovals;
        console.log("✅ Found fetchApprovals function in component props");
        break;
      }
    }
  } catch (err) {
    console.error("Error scanning React components:", err);
  }
  
  if (!fetchApprovalsFunction) {
    console.log("❌ Could not find fetchApprovals function");
    console.log("Trying to create a test version based on your code...");
    
    // Create a simplified version based on your component code
    fetchApprovalsFunction = async () => {
      console.log("🔄 Running test fetchApprovals implementation");
      
      if (!window.store) {
        console.log("❌ No Redux store found");
        return;
      }
      
      const state = window.store.getState().web3;
      const account = state.account;
      const network = state.network;
      
      if (!account || !network) {
        console.log("❌ No account or network in Redux state");
        return;
      }
      
      console.log(`📋 Would fetch approvals for account: ${account} on network: ${network}`);
      
      // Just use mock data for testing
      console.log("🟢 Using mock approvals for testing");
      window.store.dispatch({ 
        type: 'web3/setApprovals', 
        payload: debugApp.mockApprovals
      });
      
      console.log("✅ Mock approvals dispatched to Redux");
    };
  }
  
  // Try to execute the function
  try {
    console.log("🚀 Executing fetchApprovals function...");
    await fetchApprovalsFunction();
    console.log("✅ fetchApprovals executed without errors");
  } catch (err) {
    console.error("❌ Error executing fetchApprovals:", err);
  }
  
  // Check if it worked
  setTimeout(() => {
    const state = window.store.getState();
    console.log("Approvals after fetchApprovals:", state.web3.approvals);
  }, 500);
};

// ===== Inspect Approval Component Structure =====
debugApp.inspectAppStructure = () => {
  console.log("🔍 Inspecting app structure...");
  
  const componentStructure = {
    app: false,
    wallet: false,
    approvalDashboard: false,
    existingApprovals: false
  };
  
  // Check for components in the DOM
  document.querySelectorAll('div').forEach(div => {
    if (div.className && typeof div.className === 'string') {
      if (div.className.includes('app-container')) {
        componentStructure.app = true;
      }
      if (div.className.includes('wallet-connect')) {
        componentStructure.wallet = true;
      }
    }
    
    // Check for our dashboard components
    if (div.textContent && typeof div.textContent === 'string') {
      if (div.textContent.includes('Token Approvals')) {
        componentStructure.approvalDashboard = true;
      }
      if (div.textContent.includes('Existing Approvals')) {
        componentStructure.existingApprovals = true;
      }
    }
  });
  
  console.log("App structure:", componentStructure);
  return componentStructure;
};

// ===== Run All Debug Tests =====
debugApp.runAllTests = async () => {
  console.log("%c Running All Debug Tests", "font-size: 14px; font-weight: bold; color: #0066cc;");
  
  // 1. Check Redux
  console.log("\n=== Redux State Test ===");
  const reduxState = debugApp.logReduxState();
  
  // 2. Check Provider
  console.log("\n=== Provider Test ===");
  const providerResult = await debugApp.testProvider();
  
  // 3. Check Components
  console.log("\n=== Component Visibility Test ===");
  const componentsResult = debugApp.checkComponentsVisible();
  
  // 4. Check App Structure
  console.log("\n=== App Structure Test ===");
  const structureResult = debugApp.inspectAppStructure();
  
  // 5. Add Test Approvals
  console.log("\n=== Test Approvals ===");
  const approvalsResult = debugApp.addTestApprovals();
  
  // Generate overall report
  console.log("\n%c Debug Summary", "font-size: 14px; font-weight: bold; color: #0066cc;");
  console.log(`Redux Store: ${reduxState ? '✅' : '❌'}`);
  console.log(`Provider: ${providerResult.success ? '✅' : '❌'}`);
  console.log(`ApprovalDashboard: ${componentsResult.approvalDashboardVisible ? '✅' : '❌'}`);
  console.log(`ExistingApprovals: ${componentsResult.existingApprovalsVisible ? '✅' : '❌'}`);
  console.log(`Test Approvals: ${approvalsResult ? '✅' : '❌'}`);
  
  return {
    reduxOk: !!reduxState,
    providerOk: providerResult.success,
    componentsOk: componentsResult.approvalDashboardVisible && componentsResult.existingApprovalsVisible,
    approvalsOk: approvalsResult
  };
};

// Run this to fix the common issues
debugApp.quickFix = () => {
  console.log("🔧 Attempting quick fix...");
  
  try {
    // 1. Clear any existing approvals
    if (window.store) {
      window.store.dispatch({ 
        type: 'web3/setApprovals', 
        payload: [] 
      });
      console.log("✅ Cleared existing approvals in Redux");
    }
    
    // 2. Set some test approvals
    setTimeout(() => {
      if (window.store) {
        window.store.dispatch({ 
          type: 'web3/setApprovals', 
          payload: debugApp.mockApprovals
        });
        console.log("✅ Added test approvals to Redux");
      }
    }, 500);
    
    return true;
  } catch (err) {
    console.error("❌ Quick fix error:", err);
    return false;
  }
};

console.log("%c Debug tools loaded! Run debugApp.runAllTests() to check all systems.", "font-size: 14px; font-weight: bold; color: green;");
