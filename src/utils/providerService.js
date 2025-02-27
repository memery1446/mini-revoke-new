// utils/providerService.js
import { BrowserProvider } from "ethers";
import store from "../store/index";
import { setAccount, setNetwork } from "../store/web3Slice";

// Singleton provider instance
let providerInstance = null;
let initialized = false;

// Setup event listeners for wallet changes
function setupEventListeners() {
  if (typeof window === 'undefined' || !window.ethereum) return;

  // Handle account changes
  window.ethereum.on('accountsChanged', (accounts) => {
    console.log("🔄 MetaMask account changed:", accounts);
    if (accounts.length > 0) {
      store.dispatch(setAccount(accounts[0]));
      refreshProvider();
    } else {
      store.dispatch(setAccount(null));
    }
  });

  // Handle network changes
  window.ethereum.on('chainChanged', (chainId) => {
    console.log("🔄 MetaMask network changed:", chainId);
    const parsedChainId = parseInt(chainId, 16);
    store.dispatch(setNetwork(parsedChainId));
    refreshProvider();
  });

  // Handle disconnection
  window.ethereum.on('disconnect', (error) => {
    console.log("🔌 MetaMask disconnected:", error);
    store.dispatch(setAccount(null));
    providerInstance = null;
  });
}

// Create or refresh the provider
async function refreshProvider() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  
  try {
    providerInstance = new BrowserProvider(window.ethereum);
    return providerInstance;
  } catch (error) {
    console.error("❌ Error refreshing provider:", error);
    return null;
  }
}

// Initialize provider and event listeners
export async function initializeProvider() {
  if (initialized) return providerInstance;
  
  if (typeof window === 'undefined' || !window.ethereum) return null;
  
  try {
    await refreshProvider();
    setupEventListeners();
    
    // Check if already connected
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      store.dispatch(setAccount(accounts[0]));
      
      // Get current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      store.dispatch(setNetwork(parseInt(chainId, 16)));
    }
    
    initialized = true;
    return providerInstance;
  } catch (error) {
    console.error("❌ Error initializing provider:", error);
    return null;
  }
}

// Get provider instance (creates if doesn't exist)
export async function getProvider() {
  if (!providerInstance) {
    return await refreshProvider();
  }
  return providerInstance;
}

// Get signer from provider
export async function getSigner() {
  const provider = await getProvider();
  if (!provider) return null;
  
  try {
    return await provider.getSigner();
  } catch (error) {
    console.error("❌ Error getting signer:", error);
    return null;
  }
}

// Request wallet connection
export async function connectWallet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error("❌ MetaMask not installed");
    return false;
  }
  
  try {
    await refreshProvider();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (accounts.length > 0) {
      store.dispatch(setAccount(accounts[0]));
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      store.dispatch(setNetwork(parseInt(chainId, 16)));
      
      if (!initialized) {
        setupEventListeners();
        initialized = true;
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error connecting wallet:", error);
    return false;
  }
}

