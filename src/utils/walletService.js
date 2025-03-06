// utils/walletService.js
import { BrowserProvider } from "ethers";
import store from '../store/store'; // Adjust path as needed
import { setAccount, setNetwork, resetWeb3 } from '../store/web3Slice';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.initialized = false;
    this.refreshing = false;
    this.lastRefresh = 0;
    this.setupListeners();
  }

  setupListeners() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        // Account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          console.log('🔄 Account changed:', accounts);
          if (Array.isArray(accounts) && accounts.length > 0) {
            store.dispatch(setAccount(accounts[0]));
            this.refreshProvider();
          } else {
            store.dispatch(resetWeb3());
            this.provider = null;
            this.signer = null;
          }
        });

        // Chain changes
        window.ethereum.on('chainChanged', (chainId) => {
          console.log('🔄 Network changed:', chainId);
          if (chainId) {
            const networkId = parseInt(chainId, 16) || 0;
            store.dispatch(setNetwork(networkId));
            this.refreshProvider();
          }
        });

        // Disconnect
        window.ethereum.on('disconnect', (error) => {
          console.log('❌ Wallet disconnected:', error);
          store.dispatch(resetWeb3());
          this.provider = null;
          this.signer = null;
        });
        
        console.log("✅ Wallet listeners set up successfully");
      } else {
        console.log("⚠️ No ethereum provider found in window");
      }
    } catch (error) {
      console.error("❌ Error setting up wallet listeners:", error);
    }
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log("🔄 Initializing provider");
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new BrowserProvider(window.ethereum);
        console.log("Provider refreshed");
        
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log("Found accounts:", accounts?.length || 0);
        
        if (Array.isArray(accounts) && accounts.length > 0) {
          store.dispatch(setAccount(accounts[0]));
          
          // Get network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (chainId) {
            const networkId = parseInt(chainId, 16) || 0;
            store.dispatch(setNetwork(networkId));
          }
        }
        
        this.initialized = true;
        console.log("✅ Wallet service initialized");
      } else {
        console.log("⚠️ No ethereum provider available");
      }
    } catch (error) {
      console.error('❌ Error initializing wallet service:', error);
    }
  }

  async refreshProvider() {
    // Prevent rapid refreshes
    const now = Date.now();
    if (this.refreshing || (now - this.lastRefresh < 500)) {
      console.log("⏳ Provider refresh debounced");
      return;
    }
    
    this.refreshing = true;
    this.lastRefresh = now;
    
    try {
      console.log("🔄 Provider refreshed");
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new BrowserProvider(window.ethereum);
        this.signer = null; // Clear cached signer
      }
    } catch (error) {
      console.error('❌ Error refreshing provider:', error);
    } finally {
      this.refreshing = false;
    }
  }

  async connect() {
    try {
      console.log("🔌 Connecting wallet");
      if (typeof window !== 'undefined' && window.ethereum) {
        await this.refreshProvider();
        
        console.log("Requesting accounts...");
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        console.log("Accounts received:", accounts?.length || 0);
        
        if (Array.isArray(accounts) && accounts.length > 0) {
          store.dispatch(setAccount(accounts[0]));
          
          // Get network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (chainId) {
            const networkId = parseInt(chainId, 16) || 0;
            store.dispatch(setNetwork(networkId));
          }
          
          console.log("Wallet connected!");
          return true;
        }
      } else {
        console.error("No ethereum provider available");
      }
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
    }
    return false;
  }

  async getSigner() {
    if (!this.provider) {
      await this.refreshProvider();
    }
    
    try {
      if (!this.signer && this.provider) {
        this.signer = await this.provider.getSigner();
      }
      return this.signer;
    } catch (error) {
      console.error('❌ Error getting signer:', error);
      return null;
    }
  }

  async getProvider() {
    if (!this.provider) {
      await this.refreshProvider();
    }
    return this.provider;
  }
}

// Create a singleton instance
const walletService = new WalletService();

// Export methods
export const initializeWallet = () => walletService.initialize();
export const connectWallet = () => walletService.connect();
export const getWalletSigner = () => walletService.getSigner();
export const getWalletProvider = () => walletService.getProvider();

export default walletService;

