const { ethers } = require("hardhat");

// Load contract ABIs
const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');

// The deployed NFT contract address
const testNFTAddress = "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b"; // Replace with your deployed contract address

async function main() {
    const [owner, addr1] = await ethers.getSigners();

    console.log("Owner Address:", owner.address);
    console.log("addr1 Address:", addr1.address);

    const tokenId = 1; // Specify the token ID you want to revoke permissions for
    const nft = await ethers.getContractAt(testNFTABI, testNFTAddress); // Use the variable here

    // Check the current owner of the NFT
    const currentOwner = await nft.ownerOf(tokenId);
    console.log("Current owner of the NFT:", currentOwner);

    // Ensure that the caller (owner) is the actual token owner
    if (currentOwner.toLowerCase() !== owner.address.toLowerCase()) {
        console.error("The caller must be the owner of the token!");
        return;
    }

    // Revoke spending permissions by approving the zero address
    console.log(`Revoking permissions for NFT (ID ${tokenId})...`);
    await nft.approve(ethers.constants.AddressZero, tokenId);
    console.log(`Successfully revoked permissions for NFT (ID ${tokenId})`);

    // Verify that the approval was set to the zero address
    const approvedAddress = await nft.getApproved(tokenId);
    console.log("Approved address for token after revocation:", approvedAddress);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

