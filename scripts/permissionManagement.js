const { ethers } = require("hardhat");

async function managePermissions() {
    const [owner, addr1] = await ethers.getSigners();

    console.log("Owner Address:", owner.address);
    console.log("addr1 Address:", addr1.address);

    // Load contract ABIs
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    
    // Get contract instances
    const tk1 = await ethers.getContractAt(testTokenABI, "0xef66010868ff77119171628b7efa0f6179779375");
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b");

    console.log("Contract Instances Created");

    // Check allowances for ERC-20 token
    const allowance = await tk1.allowance(owner.address, addr1.address); // Get allowance for addr1
    console.log(`Current allowance for addr1 (in TK1):`, allowance.toString()); // Print as string
    
    // Revoking allowance
    if (allowance > 0) {
        console.log(`Revoking allowance for addr1 on TK1...`);
        await tk1.approve(addr1.address, 0); // Set to 0 to revoke permission
        console.log("Successfully revoked allowance for TK1 from addr1.");
    } else {
        console.log("No allowance found for addr1 on TK1.");
    }

    // Check and revoke NFT approval
    const nftTokenId = 1; // Specify the NFT ID
    const approvedAddressForNFT = await nft.getApproved(nftTokenId);
    console.log("Current approved address for NFT (ID 1):", approvedAddressForNFT);

    // Use ethers.ZeroAddress instead of ethers.constants.AddressZero
    if (approvedAddressForNFT !== ethers.ZeroAddress) { // Reference to the zero address
        console.log(`Revoking approval for NFT (ID ${nftTokenId}) from address ${approvedAddressForNFT}...`);
        await nft.approve(ethers.ZeroAddress, nftTokenId); // Revoke by setting to 0 address
        console.log("Successfully revoked approval for NFT (ID 1).");
    } else {
        console.log("No approval found for NFT (ID 1).");
    }
}

managePermissions().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

