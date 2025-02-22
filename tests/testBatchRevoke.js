const { ethers } = require("hardhat");
const { expect } = require("chai");

async function testNFTApproval() {
    const [deployer, addr1] = await ethers.getSigners();
    
    console.log("Deployer address:", deployer.address);
    console.log("addr1 address:", addr1.address);

    // Load contract ABI
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');

    // Get NFT contract instance
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b");

    console.log("\n--- Starting NFT Approval Debug ---");

    // Check NFT balances and ownership
    async function checkOwnership(address) {
        const balance = await nft.balanceOf(address);
        console.log(`NFT balance of ${address}:`, balance.toString());
        for (let i = 1; i <= 3; i++) {
            const owner = await nft.ownerOf(i);
            console.log(`Owner of NFT #${i}:`, owner);
        }
    }

    await checkOwnership(deployer.address);
    await checkOwnership(addr1.address);

    // Test NFT Approval
    console.log("\nTesting NFT approval...");
    try {
        const tokenId = 1;
        const tokenOwner = await nft.ownerOf(tokenId);
        console.log(`Owner of NFT #${tokenId}:`, tokenOwner);

        // Use the correct owner to approve
        const ownerSigner = tokenOwner === deployer.address ? deployer : addr1;
        
        // Check current approval
        const currentApproval = await nft.getApproved(tokenId);
        console.log("Current approval for NFT #1:", currentApproval);

        // Attempt to approve
        console.log("Attempting to approve addr1...");
        const approveTx = await nft.connect(ownerSigner).approve(addr1.address, tokenId);
        await approveTx.wait();
        console.log("Approval transaction completed");

        // Check new approval
        const newApproval = await nft.getApproved(tokenId);
        console.log("New approval for NFT #1:", newApproval);

        // Attempt to revoke approval
        console.log("Attempting to revoke approval...");
        const revokeTx = await nft.connect(ownerSigner).approve(ethers.ZeroAddress, tokenId);
        await revokeTx.wait();
        console.log("Revoke transaction completed");

        // Check final approval state
        const finalApproval = await nft.getApproved(tokenId);
        console.log("Final approval for NFT #1:", finalApproval);

    } catch (error) {
        console.error("NFT approval test failed:", error.message);
    }
}

// Run the test
testNFTApproval()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Test suite failed:", error);
        process.exit(1);
    });

    async function testNFTPermissions() {
    const [deployer, addr1, addr2] = await ethers.getSigners();
    
    console.log("Deployer address:", deployer.address);
    console.log("addr1 address:", addr1.address);
    console.log("addr2 address:", addr2.address);

    // Load contract ABI and get NFT contract instance
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b");

    console.log("\n--- Starting NFT Permission Tests ---");

    // 1. Test Individual Approval and Revocation
    console.log("\nTesting Individual Approval and Revocation:");
    try {
        const tokenId = 2; // Assuming deployer owns NFT #2
        await nft.connect(deployer).approve(addr1.address, tokenId);
        let approved = await nft.getApproved(tokenId);
        console.log(`Approved address for NFT #${tokenId}:`, approved);

        await nft.connect(deployer).approve(ethers.ZeroAddress, tokenId);
        approved = await nft.getApproved(tokenId);
        console.log(`Approved address after revocation for NFT #${tokenId}:`, approved);
    } catch (error) {
        console.error("Individual approval test failed:", error.message);
    }

    // 2. Test Approval for All
    console.log("\nTesting Approval for All:");
    try {
        await nft.connect(deployer).setApprovalForAll(addr1.address, true);
        let isApproved = await nft.isApprovedForAll(deployer.address, addr1.address);
        console.log("Is addr1 approved for all of deployer's NFTs?", isApproved);

        await nft.connect(deployer).setApprovalForAll(addr1.address, false);
        isApproved = await nft.isApprovedForAll(deployer.address, addr1.address);
        console.log("Is addr1 still approved for all after revocation?", isApproved);
    } catch (error) {
        console.error("Approval for all test failed:", error.message);
    }

    // 3. Test Batch Revocation
    console.log("\nTesting Batch Revocation:");
    try {
        // Approve addr2 for multiple NFTs
        await nft.connect(deployer).approve(addr2.address, 2);
        await nft.connect(deployer).approve(addr2.address, 3);
        
        // Batch revoke approvals
        await nft.connect(deployer).batchRevokeApprovals([2, 3]);
        
        // Check approvals
        const approval2 = await nft.getApproved(2);
        const approval3 = await nft.getApproved(3);
        console.log("Approval for NFT #2 after batch revoke:", approval2);
        console.log("Approval for NFT #3 after batch revoke:", approval3);
    } catch (error) {
        console.error("Batch revocation test failed:", error.message);
    }

    // 4. Test Error Handling for Permissions
    console.log("\nTesting Error Handling for Permissions:");
    try {
        // Try to approve an NFT that addr1 doesn't own
        await nft.connect(addr1).approve(addr2.address, 3);
        console.error("Error: Approval should have failed");
    } catch (error) {
        console.log("Expected error caught:", error.message);
    }

    // 5. Test Querying Multiple Approvals
    console.log("\nTesting Querying Multiple Approvals:");
    try {
        const tokenIds = [1, 2, 3, 4, 5];
        for (let tokenId of tokenIds) {
            const approved = await nft.getApproved(tokenId);
            console.log(`Approved address for NFT #${tokenId}:`, approved);
        }
    } catch (error) {
        console.error("Querying approvals test failed:", error.message);
    }
}

// Run the test
testNFTPermissions()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Test suite failed:", error);
        process.exit(1);
    });