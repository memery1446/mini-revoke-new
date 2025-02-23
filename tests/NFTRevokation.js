const { ethers } = require("hardhat");

async function testNFTRevocations() {
    console.log("\n--- Starting NFT Revocation Tests ---");
    
    const [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Load contract ABI and get instance
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b");

    // Find all NFTs owned by deployer - do this first so we have the data for all tests
    const balance = await nft.balanceOf(deployer.address);
    console.log("Deployer NFT balance:", balance.toString());
    
    // Get all token IDs owned by deployer
    const ownedTokens = [];
    for (let i = 1; i <= 10; i++) {  // Assuming max token ID of 10
        try {
            const owner = await nft.ownerOf(i);
            if (owner === deployer.address) {
                ownedTokens.push(i);
            }
        } catch (error) {
            // Skip non-existent tokens
        }
    }
    console.log("Deployer owned tokens:", ownedTokens);

    // Test 1: Set and Revoke ApprovalForAll
    console.log("\nTest 1: Set and Revoke ApprovalForAll");
    try {
        // First grant approval for all
        await nft.connect(deployer).setApprovalForAll(addr1.address, true);
        let isApproved = await nft.isApprovedForAll(deployer.address, addr1.address);
        console.log("ApprovalForAll granted:", isApproved);

        // Now revoke it
        await nft.connect(deployer).setApprovalForAll(addr1.address, false);
        isApproved = await nft.isApprovedForAll(deployer.address, addr1.address);
        console.log("ApprovalForAll revoked successfully:", !isApproved);
    } catch (error) {
        console.error("Error in ApprovalForAll test:", error.message);
    }

    // Test 2: Revoke Multiple Individual Approvals
    console.log("\nTest 2: Revoke Multiple Individual Approvals");
    try {
        if (ownedTokens.length === 0) {
            console.log("No tokens owned by deployer, skipping individual approvals test");
            return;
        }

        // First approve addr1 for all owned tokens
        for (const tokenId of ownedTokens) {
            await nft.connect(deployer).approve(addr1.address, tokenId);
            console.log(`Approved token ${tokenId} for addr1`);
        }

        // Verify approvals
        for (const tokenId of ownedTokens) {
            const approved = await nft.getApproved(tokenId);
            console.log(`Token ${tokenId} approved address:`, approved);
        }

        // Now revoke all individual approvals
        for (const tokenId of ownedTokens) {
            await nft.connect(deployer).approve(ethers.ZeroAddress, tokenId);
            console.log(`Revoked approval for token ${tokenId}`);
        }

        // Verify revocations
        for (const tokenId of ownedTokens) {
            const approved = await nft.getApproved(tokenId);
            console.log(`Token ${tokenId} approval after revocation:`, approved);
        }
    } catch (error) {
        console.error("Error in individual approvals test:", error.message);
    }

    // Test 3: Test Multiple Operator Revocations
    console.log("\nTest 3: Multiple Operator Revocations");
    try {
        // Grant approvalForAll to multiple operators
        const operators = [addr1, addr2, addr3];
        for (const operator of operators) {
            await nft.connect(deployer).setApprovalForAll(operator.address, true);
            console.log(`Granted ApprovalForAll to ${operator.address}`);
        }

        // Verify all approvals
        for (const operator of operators) {
            const isApproved = await nft.isApprovedForAll(deployer.address, operator.address);
            console.log(`Operator ${operator.address} approval status:`, isApproved);
        }

        // Revoke all operator approvals
        for (const operator of operators) {
            await nft.connect(deployer).setApprovalForAll(operator.address, false);
            console.log(`Revoked ApprovalForAll from ${operator.address}`);
        }

        // Verify all revocations
        for (const operator of operators) {
            const isApproved = await nft.isApprovedForAll(deployer.address, operator.address);
            console.log(`Operator ${operator.address} approval status after revocation:`, isApproved);
        }
    } catch (error) {
        console.error("Error in multiple operator test:", error.message);
    }

    // Test 4: Gas Usage Comparison
    console.log("\nTest 4: Gas Usage Comparison");
    try {
        if (ownedTokens.length === 0) {
            console.log("No tokens owned by deployer, skipping gas comparison test");
            return;
        }

        // Measure gas for individual approval revocation
        const tx1 = await nft.connect(deployer).approve(ethers.ZeroAddress, ownedTokens[0]);
        const receipt1 = await tx1.wait();
        console.log("Gas used for single approval revocation:", receipt1.gasUsed.toString());

        // Measure gas for setApprovalForAll revocation
        const tx2 = await nft.connect(deployer).setApprovalForAll(addr1.address, false);
        const receipt2 = await tx2.wait();
        console.log("Gas used for setApprovalForAll revocation:", receipt2.gasUsed.toString());

        // Calculate gas savings
        const gasSaved = receipt1.gasUsed - receipt2.gasUsed;
        console.log("Gas saved using setApprovalForAll vs single approval:", gasSaved.toString());
        
        if (ownedTokens.length > 1) {
            const projectedSavings = BigInt(gasSaved) * BigInt(ownedTokens.length - 1);
            console.log("Projected gas savings for revoking all tokens:", projectedSavings.toString());
        }
    } catch (error) {
        console.error("Error in gas measurement:", error.message);
    }
}

// Run the tests
testNFTRevocations()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Test suite failed:", error);
        process.exit(1);
    });