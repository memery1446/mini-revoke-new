// Import dependencies
const { ethers } = require("hardhat");

async function main() {
    // Get the first signer (default deployer's account)
    const [deployer] = await ethers.getSigners();

    console.log("🚀 Deploying MockSpender contract...");
    console.log("📜 Deployer Address:", deployer.address);

    // Deploy the MockSpender contract
    const MockSpender = await ethers.getContractFactory("MockSpender");
    const mockSpender = await MockSpender.deploy();

    await mockSpender.deployed();

    console.log("✅ MockSpender deployed to:", mockSpender.address);

    // Save contract address for future references
    console.log(`📍 Saving MockSpender address...`);
    const fs = require("fs");
    fs.writeFileSync(
        "./deployed-mock-spender.json",
        JSON.stringify({ address: mockSpender.address }, null, 2)
    );

    console.log("📂 Address saved in deployed-mock-spender.json");

    // Optional: Verification step (for Etherscan if deployed on testnets/mainnet)
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("🔍 Verifying contract on Etherscan...");
        await mockSpender.deployTransaction.wait(6); // Wait for confirmations
        await run("verify:verify", {
            address: mockSpender.address,
            constructorArguments: [],
        });
        console.log("✅ Verified on Etherscan");
    }
}

// Execute the deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });


