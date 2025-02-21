import { ethers } from "ethers";

const getProvider = () => {
    // Hardhat node URL
    const HARDHAT_URL = "http://127.0.0.1:8545";
    
    // If window.ethereum is available, make sure it's connected to Hardhat
    if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Check the network and warn if it's not Hardhat
        provider.getNetwork().then(network => {
            console.log(`✅ Current wallet network: ${network.name} (ID: ${network.chainId})`);
            if (network.chainId !== 1337) {
                console.warn("⚠️ WARNING: Your wallet is not connected to the Hardhat network (1337)");
                console.warn("Please switch your wallet to the Hardhat network at http://localhost:8545");
            }
        });
        
        return provider;
    }
    
    // If no wallet is connected, use direct connection to Hardhat
    console.log("📡 Connecting directly to Hardhat at", HARDHAT_URL);
    return new ethers.providers.JsonRpcProvider(HARDHAT_URL);
};

export default getProvider;