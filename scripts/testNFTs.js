const { ethers } = require("hardhat");

async function testNFTs() {
    const [owner, addr1] = await ethers.getSigners();

    console.log("Owner Address:", owner.address);
    console.log("addr1 Address:", addr1.address);

    // Load contract ABIs
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');

    // The deployed NFT contract address
    const testNFTAddress = "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354"; // Replace as necessary
    const nft = await ethers.getContractAt(testNFTABI, testNFTAddress);

    console.log("Contract Instances Created");

    const nftTokenId = 1; // Specify the token ID to check
    const currentOwner = await nft.ownerOf(nftTokenId);
    console.log("Current owner of the NFT:", currentOwner);

    // Log the current approved address
    const approvedAddressForNFT = await nft.getApproved(nftTokenId);
    console.log("Current approved address for NFT (ID 1):", approvedAddressForNFT);

    // Define AddressZero manually to avoid the error
    const AddressZero = "0x0000000000000000000000000000000000000000";
    
    // Revoke NFT approval
    if (approvedAddressForNFT !== AddressZero) {
        console.log(`Revoking approval for NFT (ID ${nftTokenId}) from address ${approvedAddressForNFT}...`);
        await nft.approve(AddressZero, nftTokenId); // Revoke by setting approval to the zero address
        console.log("Successfully revoked approval for NFT (ID 1).");
    } else {
        console.log("No approval found for NFT (ID 1).");
    }
}

testNFTs().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

