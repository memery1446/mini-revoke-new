import { JsonRpcProvider, BrowserProvider } from "ethers";

// Log that the provider module is loaded
console.log("🔌 provider.js loaded - " + new Date().toISOString());

// ✅ Load API keys from environment variables
const NETWORK_RPC_URLS = {
    1: process.env.REACT_APP_ALCHEMY_MAINNET_URL, // Ethereum Mainnet
    11155111: process.env.REACT_APP_ALCHEMY_SEPOLIA_URL, // Sepolia Testnet
    10: process.env.REACT_APP_ALCHEMY_OPTIMISM_URL, // Optimism
    42161: process.env.REACT_APP_ALCHEMY_ARBITRUM_URL, // Arbitrum One
    137: process.env.REACT_APP_ALCHEMY_POLYGON_URL, // Polygon Mainnet
    56: "https://bsc-dataseed.binance.org/", // Binance Smart Chain (Public RPC)
    420: process.env.REACT_APP_ALCHEMY_OPTIMISM_GOERLI_URL, // Optimism Goerli
    421613: process.env.REACT_APP_ALCHEMY_ARBITRUM_GOERLI_URL, // Arbitrum Goerli
    80001: process.env.REACT_APP_ALCHEMY_POLYGON_MUMBAI_URL, // Polygon Mumbai
};

// Expose network info to window for debugging
if (typeof window !== 'undefined') {
    window.NETWORK_INFO = {
        supportedNetworks: Object.keys(NETWORK_RPC_URLS).map(Number),
        getNetworkName: (chainId) => {
            const names = {
                1: "Ethereum Mainnet",
                11155111: "Sepolia Testnet",
                10: "Optimism",
                42161: "Arbitrum One",
                137: "Polygon Mainnet",
                56: "Binance Smart Chain",
                420: "Optimism Goerli",
                421613: "Arbitrum Goerli",
                80001: "Polygon Mumbai"
            };
            return names[chainId] || `Unknown Network (${chainId})`;
        }
    };
    console.log("🌐 Network info exposed to window.NETWORK_INFO");
}

// ✅ Bootstrap Wrapper for UI Components
const BootstrapWrapper = ({ children }) => (
    <div className="container mt-4">{children}</div>
);

async function getProvider() {
    try {
        console.log("📡 Attempting to get provider...");
        
        if (typeof window !== "undefined" && window.ethereum) {
            console.log("🦊 MetaMask or similar provider detected");
            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);
            console.log(`✅ Connected to Chain ID: ${chainId}`);
            
            // Update Redux store with network info - using window.store instead of direct import
            if (typeof window !== 'undefined' && window.store && window.store.dispatch) {
                window.store.dispatch({ type: 'web3/setNetwork', payload: chainId });
                console.log("🔄 Updated network in Redux:", chainId);
            } else {
                console.warn("⚠️ Redux store not available, network not updated");
            }

            // ✅ Check if the network is supported
            if (!NETWORK_RPC_URLS[chainId]) {
                console.warn(`⚠️ WARNING: Network (${chainId}) not supported.`);
                return provider; // Still return provider even if network is not in our list
            }
            
            // Expose the provider to window for debugging
            if (typeof window !== 'undefined') {
                window.ethersProvider = provider;
                console.log("🔌 Provider exposed as window.ethersProvider");
            }
            
            return provider;
        }

        // ✅ Automatically detect the right network RPC
        const defaultNetwork = 11155111; // Default to Sepolia if nothing is set
        console.log("📡 No wallet detected, using RPC:", NETWORK_RPC_URLS[defaultNetwork]);
        
        // Update Redux with the default network - using window.store instead of direct import
        if (typeof window !== 'undefined' && window.store && window.store.dispatch) {
            window.store.dispatch({ type: 'web3/setNetwork', payload: defaultNetwork });
            console.log("🔄 Updated network in Redux to default:", defaultNetwork);
        }
        
        const fallbackProvider = new JsonRpcProvider(NETWORK_RPC_URLS[defaultNetwork]);
        
        // Expose the fallback provider to window for debugging
        if (typeof window !== 'undefined') {
            window.ethersProvider = fallbackProvider;
            console.log("🔌 Fallback provider exposed as window.ethersProvider");
        }
        
        return fallbackProvider;
    } catch (error) {
        console.error("❌ Provider error:", error);
        return null;
    }
}

export { getProvider, BootstrapWrapper };
