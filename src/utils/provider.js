import { JsonRpcProvider, BrowserProvider } from "ethers";

// Log that the provider module is loaded
console.log("🔌 provider.js loaded - " + new Date().toISOString());

// Load API keys from environment variables
const NETWORK_RPC_URLS = {
    1: process.env.MAINNET_RPC_URL, // Ethereum Mainnet
    11155111: process.env.SEPOLIA_RPC_URL, // Sepolia Testnet
    10: process.env.OPTIMISM_RPC_URL, // Optimism
    42161: process.env.ARBITRUM_RPC_URL, // Arbitrum One
    137: process.env.POLYGON_RPC_URL, // Polygon Mainnet
    56: "https://bsc-dataseed.binance.org/", // Binance Smart Chain (Public RPC)
    420: process.env.OPTIMISM_GOERLI_RPC_URL, // Optimism Goerli
    421613: process.env.ARBITRUM_GOERLI_RPC_URL, // Arbitrum Goerli
    80001: process.env.POLYGON_MUMBAI_RPC_URL, // Polygon Mumbai
};

// Expose network info to window
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

// ✅ **Re-added Bootstrap Wrapper**
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

            // Update Redux store with network info
            if (window.store && window.store.dispatch) {
                window.store.dispatch({ type: 'web3/setNetwork', payload: chainId });
                console.log("🔄 Updated network in Redux:", chainId);
            } else {
                console.warn("⚠️ Redux store not available, network not updated");
            }

            // Expose the provider to window for debugging
            window.ethersProvider = provider;
            console.log("🔌 Provider exposed as window.ethersProvider");
            return provider;
        }

        // Automatically detect the right network RPC
        const defaultNetwork = 11155111; // Default to Sepolia if nothing is set
        const rpcUrl = NETWORK_RPC_URLS[defaultNetwork];

        if (!rpcUrl) {
            throw new Error("🚨 No valid RPC URL found! Check your .env file.");
        }

        console.log(`📡 No wallet detected, using RPC: ${rpcUrl}`);
        
        // Update Redux with the default network
        if (window.store && window.store.dispatch) {
            window.store.dispatch({ type: 'web3/setNetwork', payload: defaultNetwork });
            console.log("🔄 Updated network in Redux to default:", defaultNetwork);
        }

        // Use the correct RPC provider (NOT localhost)
        const fallbackProvider = new JsonRpcProvider(rpcUrl);

        // Expose the fallback provider to window for debugging
        window.ethersProvider = fallbackProvider;
        console.log("🔌 Fallback provider exposed as window.ethersProvider");
        
        return fallbackProvider;
    } catch (error) {
        console.error("❌ Provider error:", error);
        return null;
    }
}

// ✅ **Fixed: Now exporting `BootstrapWrapper`**
export { getProvider, BootstrapWrapper };


