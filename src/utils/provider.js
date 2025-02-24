import { JsonRpcProvider, BrowserProvider } from "ethers";

// ❌ REMOVE dotenv.config(); from frontend React apps
const SEPOLIA_RPC_URL = process.env.REACT_APP_ALCHEMY_SEPOLIA_URL; // Use Vercel environment variable
const BootstrapWrapper = ({ children }) => (
    <div className="container mt-4">{children}</div>
);

async function getProvider() {
    try {
        if (typeof window !== "undefined" && window.ethereum) {
            // ✅ Use MetaMask (BrowserProvider) if available
            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            console.log(`✅ Connected to Chain ID: ${network.chainId}`);

            // 🔥 Only allow Sepolia
            if (network.chainId !== 11155111) {
                console.warn("⚠️ WARNING: Connect wallet to Sepolia (11155111).");
            }
            return provider;
        }

        // ✅ Always use Alchemy for Sepolia
        console.log("📡 Using Sepolia RPC:", SEPOLIA_RPC_URL);
        return new JsonRpcProvider(SEPOLIA_RPC_URL);
    } catch (error) {
        console.error("❌ Provider error:", error);
        return null;
    }
}

export { getProvider, BootstrapWrapper };


