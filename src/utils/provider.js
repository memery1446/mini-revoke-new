import { JsonRpcProvider, BrowserProvider } from "ethers";

const HARDHAT_URL = "http://127.0.0.1:8545";

// ✅ Ensure Provider Always Returns a Valid Object
async function getProvider() {
    try {
        if (typeof window !== "undefined" && window.ethereum) {
const provider = new JsonRpcProvider("http://127.0.0.1:8545");
            const network = await provider.getNetwork();
            console.log(`✅ Current wallet network: Chain ID ${network.chainId}`);

            if (network.chainId !== 1337) {
                console.warn("⚠️ WARNING: Your wallet is not connected to the Hardhat network (1337)");
                console.warn("Please switch your wallet to Hardhat (http://localhost:8545)");
            }
            return provider;
        }

        console.log("📡 Connecting directly to Hardhat at", HARDHAT_URL);
        return new JsonRpcProvider(HARDHAT_URL);
    } catch (error) {
        console.error("❌ Error getting provider:", error);
        return null; // Prevents undefined errors
    }
}

// ✅ Bootstrap Wrapper (Replaces Chakra UI)
const BootstrapWrapper = ({ children }) => (
    <div className="container mt-4">{children}</div>
);

export { getProvider, BootstrapWrapper };
