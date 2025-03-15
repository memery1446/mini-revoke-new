import { JsonRpcProvider, BrowserProvider } from "ethers";

console.log("🔌 provider.js loaded - " + new Date().toISOString());

const getRpcUrl = () => {
  return process.env.HARDHAT_RPC_URL || 
         `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` || 
         "https://ethereum-sepolia-rpc.publicnode.com"; // Public fallback
};

const NETWORK_RPC_URLS = {
    1337: getRpcUrl(), // Hardhat Testnet
};

if (typeof window !== 'undefined') {
    window.NETWORK_INFO = {
        supportedNetworks: Object.keys(NETWORK_RPC_URLS).map(Number),
        getNetworkName: (chainId) => {
            const names = {
                1: "Ethereum Mainnet",
                11155111: "Sepolia Testnet",
                31337: "Hardhat Localhost"
            };
            return names[chainId] || `Unknown Network (${chainId})`;
        }
    };
    console.log("🌐 Network info exposed to window.NETWORK_INFO");
}

async function getProvider() {
    try {
        console.log("📡 Attempting to get provider...");

        if (typeof window !== "undefined" && window.ethereum) {
            console.log("🦊 MetaMask or similar provider detected");
            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            if (chainId !== 1337) {
                alert("❌ Wrong network detected! Please switch to Hardhat in MetaMask.");
                return null;
            }

            console.log(`✅ Connected to Chain ID: ${chainId}`);

            window.ethersProvider = provider; // Assign to global scope immediately
            console.log("🔌 Provider set globally!");

            if (window.store && window.store.dispatch) {
                window.store.dispatch({ type: 'web3/setNetwork', payload: chainId });
                console.log("🔄 Updated network in Redux:", chainId);
            }

            return provider;
        }

        const rpcUrl = getRpcUrl();
        console.log(`📡 No wallet detected, using RPC: ${rpcUrl}`);

        const fallbackProvider = new JsonRpcProvider(rpcUrl);
        window.ethersProvider = fallbackProvider;
        console.log("🔌 Fallback provider set globally!");

        return fallbackProvider;
    } catch (error) {
        console.error("❌ Provider error:", error);
        return null;
    }
}

// ✅ Restore BootstrapWrapper
const BootstrapWrapper = ({ children }) => {
  return <div className="bootstrap-wrapper">{children}</div>;
};

// ✅ Force provider setup when the script loads
(async () => {
    console.log("🔄 Ensuring provider is initialized...");
    await getProvider();
    console.log("✅ Provider setup complete!");
})();

export { getProvider, BootstrapWrapper };
