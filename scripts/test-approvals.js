const hre = require("hardhat");

async function main() {
    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];

    console.log(`📝 Using deployer: ${deployer.address}`);

    // ✅ Get contract instance with signer
    const tk1 = await hre.ethers.getContractAt("TestToken", "0xYour_TK1_Address", deployer);

    // ✅ Explicitly define spender address as a string
    const spenderAddress = "0xYour_MockSpender_Address";

    console.log("🚀 Approving 100 TK1 to MockSpender...");
    const approveTx = await tk1.approve(String(spenderAddress), hre.ethers.parseUnits("100", 18));
    await approveTx.wait();
    console.log("✅ Approval transaction confirmed!");

    // ✅ Check allowance
    const allowance = await tk1.allowance(deployer.address, String(spenderAddress));
    console.log(`✅ Allowance granted: ${allowance.toString()}`);
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});
