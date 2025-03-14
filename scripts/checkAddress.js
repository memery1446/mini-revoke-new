const { ethers } = require("hardhat");

async function main() {
    const address = "0x0dB30c6cC6440E2B534D06edF2969fcaEd1C6B2B";
    
    try {
        const checksummed = ethers.getAddress(address);
        console.log(`✅ Correct Checksum Address: ${checksummed}`);
    } catch (error) {
        console.error(`❌ Address checksum failed: ${address}`);
    }
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});

