import { JsonRpcProvider, BrowserProvider } from "ethers";

// Log that the provider module is loaded
console.log("🔌 provider.js loaded - " + new Date().toISOString());

// Function to get RPC URL from environment variables
const getRpcUrl = () => {
  return process.env.SEPOLIA_RPC_URL || 
         `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` || 
         "https://ethereum-sepolia-rpc.publicnode.com"; // Public fallback
};

// Load API keys from environment variables
const NETWORK_RPC_URLS = {
    11155111: getRpcUrl(), // Sepolia Testnet
};

// Expose network info to window for debugging
if (typeof window !== 'undefined') {
    window.NETWORK_INFO = {
        supportedNetworks: Object.keys(NETWORK_RPC_URLS).map(Number),
        getNetworkName: (chainId) => {
            const names = {
                1: "Ethereum Mainnet",
                11155111: "Sepolia Testnet",
            };
            return names[chainId] || `Unknown Network (${chainId})`;
        }
    };
    console.log("🌐 Network info exposed to window.NETWORK_INFO");
}

// ✅ Ensure BootstrapWrapper is correctly defined
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

            // 🚨 Ensure Sepolia is used 🚨
            if (chainId !== 11155111) {
                alert("❌ Wrong network detected! Please switch to Sepolia in MetaMask.");
                return null;
            }

            console.log(`✅ Connected to Chain ID: ${chainId}`);

            // Update Redux store
            if (window.store && window.store.dispatch) {
                window.store.dispatch({ type: 'web3/setNetwork', payload: chainId });
                console.log("🔄 Updated network in Redux:", chainId);
            }

            window.ethersProvider = provider;
            console.log("🔌 Provider exposed as window.ethersProvider");
            return provider;
        }

        // Use the correct RPC provider (not localhost)
        const rpcUrl = getRpcUrl();
        console.log(`📡 No wallet detected, using RPC: ${rpcUrl}`);

        const fallbackProvider = new JsonRpcProvider(rpcUrl);
        window.ethersProvider = fallbackProvider;
        console.log("🔌 Fallback provider exposed as window.ethersProvider");

        return fallbackProvider;
    } catch (error) {
        console.error("❌ Provider error:", error);
        return null;
    }
}

// ✅ **Export everything correctly**
export { getProvider, BootstrapWrapper };

