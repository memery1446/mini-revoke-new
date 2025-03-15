const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`🚀 Deploying Mock ERC-20 from ${deployer.address}`);

    const ERC20Mock = await ethers.getContractFactory("MockERC20");
    const erc20 = await ERC20Mock.deploy("Mock USDC", "mUSDC", 18);
    await erc20.waitForDeployment();

    console.log(`✅ ERC-20 Deployed: ${await erc20.getAddress()}`);

    // Transfer tokens to mock wallet
    const mockWallet = "0xe216780bF9B30811E9260bfA23b28b22656cF12f";
    const tx = await erc20.transfer(mockWallet, ethers.parseUnits("1000", 18));
    await tx.wait();
    console.log(`💰 Transferred 1,000 mUSDC to Mock Wallet`);
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
});
