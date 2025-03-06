// utils/providerService.js
import { BrowserProvider } from "ethers";

// Force direct console access
const safeConsole = {
  log: window.console.log.bind(window.console),
  error: window.console.error.bind(window.console),
  warn: window.console.warn.bind(window.console)
};

// Singleton provider instance
let providerInstance = null;
let initialized = false;

// Safely dispatch Redux actions
function safeDispatch(action) {
  try {
    if (window.store && typeof window.store.dispatch === 'function') {
      window.store.dispatch(action);
      safeConsole.log("🚀 Dispatched action:", action);
      return true;
    } else {
      safeConsole.error("❌ Redux store not available for dispatch");
      window._updateDebug?.("Redux store not available");
      return false;
    }
  } catch (error) {
    safeConsole.error("❌ Error dispatching action:", error);
    window._updateDebug?.(`Dispatch error: ${error.message}`);
    return false;
  }
}

// Setup event listeners for wallet changes
function setupEventListeners() {
  safeConsole.log("Setting up event listeners");
  window._updateDebug?.("Setting up wallet listeners");

  if (typeof window === 'undefined' || !window.ethereum) {
    safeConsole.log("No ethereum provider found");
    window._updateDebug?.("No ethereum provider found");
    return;
  }

  // Handle account changes
  window.ethereum.on('accountsChanged', (accounts) => {
    safeConsole.log("🔄 MetaMask account changed:", accounts);
    window._updateDebug?.(`Accounts changed: ${accounts[0] || 'none'}`);
    
    if (accounts.length > 0) {
      safeDispatch({ type: 'web3/setAccount', payload: accounts[0] });
      refreshProvider();
    } else {
      safeDispatch({ type: 'web3/setAccount', payload: null });
    }
  });

  // Handle network changes
  window.ethereum.on('chainChanged', (chainId) => {
    safeConsole.log("🔄 MetaMask network changed:", chainId);
    window._updateDebug?.(`Chain changed: ${chainId}`);
    
    const parsedChainId = parseInt(chainId, 16);
    safeDispatch({ type: 'web3/setNetwork', payload: parsedChainId });
    refreshProvider();
  });

  // Handle disconnection
  window.ethereum.on('disconnect', (error) => {
    safeConsole.log("🔌 MetaMask disconnected:", error);
    window._updateDebug?.("MetaMask disconnected");
    
    safeDispatch({ type: 'web3/setAccount', payload: null });
    providerInstance = null;
  });
}

// Create or refresh the provider
async function refreshProvider() {
  safeConsole.log("Refreshing provider");
  
  if (typeof window === 'undefined' || !window.ethereum) {
    safeConsole.error("No ethereum provider available");
    return null;
  }
  
  try {
    providerInstance = new BrowserProvider(window.ethereum);
    safeConsole.log("Provider refreshed successfully");
    window._updateDebug?.("Provider refreshed");
    return providerInstance;
  } catch (error) {
    safeConsole.error("❌ Error refreshing provider:", error);
    window._updateDebug?.(`Provider refresh error: ${error.message}`);
    return null;
  }
}

// Initialize provider and event listeners
export async function initializeProvider() {
  safeConsole.log("Initializing provider");
  window._updateDebug?.("Initializing provider");
  
  if (initialized) {
    safeConsole.log("Provider already initialized");
    return providerInstance;
  }
  
  if (typeof window === 'undefined' || !window.ethereum) {
    safeConsole.error("No ethereum provider found");
    window._updateDebug?.("No ethereum provider");
    return null;
  }
  
  try {
    await refreshProvider();
    setupEventListeners();
    
    // Check if already connected
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    safeConsole.log("Retrieved accounts:", accounts);
    window._updateDebug?.(`Found accounts: ${accounts.length}`);
    
    if (accounts.length > 0) {
      safeDispatch({ type: 'web3/setAccount', payload: accounts[0] });
      
      // Get current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      safeDispatch({ type: 'web3/setNetwork', payload: parseInt(chainId, 16) });
      
      safeConsole.log("Account and network set from existing connection");
      window._updateDebug?.(`Connected: ${accounts[0]}`);
    }
    
    initialized = true;
    return providerInstance;
  } catch (error) {
    safeConsole.error("❌ Error initializing provider:", error);
    window._updateDebug?.(`Init error: ${error.message}`);
    return null;
  }
}

// Get provider instance (creates if doesn't exist)
export async function getProvider() {
  safeConsole.log("Getting provider");
  
  if (!providerInstance) {
    safeConsole.log("Provider not initialized, refreshing");
    return await refreshProvider();
  }
  return providerInstance;
}

// Get signer from provider
export async function getSigner() {
  safeConsole.log("Getting signer");
  
  const provider = await getProvider();
  if (!provider) {
    safeConsole.error("Provider not available for signer");
    return null;
  }
  
  try {
    const signer = await provider.getSigner();
    safeConsole.log("Signer retrieved successfully");
    return signer;
  } catch (error) {
    safeConsole.error("❌ Error getting signer:", error);
    window._updateDebug?.(`Signer error: ${error.message}`);
    return null;
  }
}

// Request wallet connection
export async function connectWallet() {
  safeConsole.log("Connecting wallet");
  window._updateDebug?.("Connecting wallet");
  
  if (typeof window === 'undefined' || !window.ethereum) {
    safeConsole.error("❌ MetaMask not installed");
    window._updateDebug?.("MetaMask not installed");
    return false;
  }
  
  try {
    await refreshProvider();
    
    // Request accounts
    safeConsole.log("Requesting accounts");
    window._updateDebug?.("Requesting accounts...");
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    safeConsole.log("Accounts received:", accounts);
    window._updateDebug?.(`Accounts received: ${accounts.length}`);
    
    if (accounts.length > 0) {
      // Update Redux store
      safeDispatch({ type: 'web3/setAccount', payload: accounts[0] });
      
      // Get and set network ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      safeDispatch({ type: 'web3/setNetwork', payload: parseInt(chainId, 16) });
      
      // Make sure event listeners are set up
      if (!initialized) {
        setupEventListeners();
        initialized = true;
      }
      
      safeConsole.log("Wallet connected successfully");
      window._updateDebug?.("Wallet connected!");
      return true;
    }
    
    safeConsole.warn("No accounts returned after connection request");
    window._updateDebug?.("No accounts returned");
    return false;
  } catch (error) {
    safeConsole.error("❌ Error connecting wallet:", error);
    window._updateDebug?.(`Connection error: ${error.message}`);
    return false;
  }
}

// Export for debug access
if (typeof window !== 'undefined') {
  window.providerDebug = {
    refreshProvider,
    getProvider,
    initializeProvider,
    connectWallet
  };
}

