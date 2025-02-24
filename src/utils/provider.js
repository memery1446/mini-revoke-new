import { JsonRpcProvider, BrowserProvider } from "ethers";

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

// ✅ Bootstrap Wrapper for UI Components
const BootstrapWrapper = ({ children }) => (
    <div className="container mt-4">{children}</div>
);

async function getProvider() {
    try {
        if (typeof window !== "undefined" && window.ethereum) {
            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            console.log(`✅ Connected to Chain ID: ${network.chainId}`);

            // ✅ Check if the network is supported
            if (!NETWORK_RPC_URLS[network.chainId]) {
                console.warn(`⚠️ WARNING: Network (${network.chainId}) not supported.`);
                return null;
            }
            return provider;
        }

        // ✅ Automatically detect the right network RPC
        const defaultNetwork = 11155111; // Default to Sepolia if nothing is set
        console.log("📡 Using RPC:", NETWORK_RPC_URLS[defaultNetwork]);
        return new JsonRpcProvider(NETWORK_RPC_URLS[defaultNetwork]);
    } catch (error) {
        console.error("❌ Provider error:", error);
        return null;
    }
}

export { getProvider, BootstrapWrapper };

