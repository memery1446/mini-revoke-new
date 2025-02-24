const hre = require("hardhat");

async function main() {
    const signers = await hre.ethers.getSigners();
    console.log("📜 Available Accounts:");
    signers.forEach((signer, index) => {
        console.log(`${index + 1}: ${signer.address}`);
    });
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});

