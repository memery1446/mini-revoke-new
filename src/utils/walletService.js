// utils/walletService.js
import { BrowserProvider } from "ethers";
import store from '../store/store'; // Adjust path as needed
import { setAccount, setNetwork, resetWeb3 } from '../store/web3Slice';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.initialized = false;
    this.setupListeners();
  }

  setupListeners() {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('🔄 Account changed:', accounts);
        if (accounts.length > 0) {
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
        store.dispatch(setNetwork(parseInt(chainId, 16)));
        this.refreshProvider();
      });

      // Disconnect
      window.ethereum.on('disconnect', (error) => {
        console.log('❌ Wallet disconnected:', error);
        store.dispatch(resetWeb3());
        this.provider = null;
        this.signer = null;
      });
    }
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new BrowserProvider(window.ethereum);
        
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          store.dispatch(setAccount(accounts[0]));
          
          // Get network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          store.dispatch(setNetwork(parseInt(chainId, 16)));
        }
        
        this.initialized = true;
      }
    } catch (error) {
      console.error('Error initializing wallet service:', error);
    }
  }

  async refreshProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum);
    }
  }

  async connect() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new BrowserProvider(window.ethereum);
        
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          store.dispatch(setAccount(accounts[0]));
          
          // Get network
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          store.dispatch(setNetwork(parseInt(chainId, 16)));
          
          return true;
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
    return false;
  }

  async getSigner() {
    if (!this.provider) {
      await this.refreshProvider();
    }
    
    try {
      this.signer = await this.provider.getSigner();
      return this.signer;
    } catch (error) {
      console.error('Error getting signer:', error);
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

