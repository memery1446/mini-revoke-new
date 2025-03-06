const { ethers, run } = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("🚀 Deploying MockSpender contract...");
    console.log("📜 Deployer Address:", deployer.address);

    const MockSpender = await ethers.getContractFactory("MockSpender");
    const mockSpender = await MockSpender.deploy();

    console.log("⏳ Waiting for deployment to complete...");
    await mockSpender.waitForDeployment(); 

    const contractAddress = await mockSpender.getAddress(); 

    console.log("✅ MockSpender deployed to:", contractAddress);

    fs.writeFileSync(
        "./deployed-mock-spender.json",
        JSON.stringify({ address: contractAddress }, null, 2)
    );

    console.log("📂 Address saved in deployed-mock-spender.json");

    if (process.env.ETHERSCAN_API_KEY) {
        console.log("🔍 Verifying contract on Etherscan...");
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: [],
        });
        console.log("✅ Verified on Etherscan");
    }
}

// Run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

    