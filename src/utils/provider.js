import { JsonRpcProvider, BrowserProvider } from "ethers";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const HARDHAT_URL = "http://127.0.0.1:8545";
const SEPOLIA_RPC_URL = process.env.ALCHEMY_SEPOLIA_URL; // Read from .env

async function getProvider() {
    try {
        if (typeof window !== "undefined" && window.ethereum) {
            // ✅ Use MetaMask (BrowserProvider) if available
            const provider = new BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            console.log(`✅ Connected to Chain ID: ${network.chainId}`);

            // 🔥 Only allow Sepolia or Hardhat
            if (![1337, 11155111].includes(network.chainId)) {
                console.warn("⚠️ WARNING: Connect wallet to Hardhat (1337) or Sepolia (11155111).");
            }
            return provider;
        }

        // ✅ Auto-switch to Alchemy for Sepolia
        console.log("📡 Using RPC:", process.env.NODE_ENV === "production" ? "Alchemy (Sepolia)" : "Hardhat");

        return new JsonRpcProvider(process.env.NODE_ENV === "production" ? SEPOLIA_RPC_URL : HARDHAT_URL);
    } catch (error) {
        console.error("❌ Provider error:", error);
        return null;
    }
}

export { getProvider };
