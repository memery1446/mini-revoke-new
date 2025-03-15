const { ethers, network } = require("hardhat");

async function main() {
    // Generate a new wallet
    const mockWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    console.log(`🆕 Mock Wallet Address: ${mockWallet.address}`);

    // Impersonate and fund the wallet with ETH
    await network.provider.send("hardhat_setBalance", [
        mockWallet.address,
        "0x21E19E0C9BAB2400000", // 10 ETH in wei
    ]);
    console.log("💰 Funded mock wallet with 10 ETH");

    // Deploy mock ERC-20, ERC-721, and ERC-1155 tokens
    // (Use OpenZeppelin templates or your own contracts)

    console.log("✅ Mock wallet ready!");
}

main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});

