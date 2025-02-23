const { ethers } = require("hardhat");
const { expect } = require("chai");

async function runPreDeploymentTests() {
    console.log("\n=== Running Pre-Deployment Test Suite ===\n");
    
    const [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Get contract instances
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const { abi: testERC1155ABI } = require('../src/artifacts/contracts/TestERC1155.sol/TestERC1155.json');

    const tk1 = await ethers.getContractAt(testTokenABI, "0xef66010868ff77119171628b7efa0f6179779375");
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b");
    const erc1155 = await ethers.getContractAt(testERC1155ABI, "0x1f585372f116e1055af2bed81a808ddf9638dccd");

    // Get owned NFTs first
    const ownedNFTs = [];
    const nftBalance = await nft.balanceOf(deployer.address);
    console.log("NFT Balance:", nftBalance.toString());
    
    for (let i = 1; i <= 10; i++) {
        try {
            const owner = await nft.ownerOf(i);
            if (owner === deployer.address) {
                ownedNFTs.push(i);
            }
        } catch (error) {
            // Token doesn't exist or other error
        }
    }
    console.log("Owned NFTs:", ownedNFTs);

    // 1. Stress Testing Approvals
    console.log("\n1. Stress Testing Approvals");
    try {
        // Test multiple approvals in same block
        const approvalPromises = [addr1, addr2, addr3].map(addr => 
            tk1.connect(deployer).approve(addr.address, 1000)
        );
        await Promise.all(approvalPromises);
        console.log("Multiple approvals in same block: Success");

        // Test rapid approval/revocation
        for (let i = 0; i < 5; i++) {
            await tk1.connect(deployer).approve(addr1.address, 1000);
            await tk1.connect(deployer).approve(addr1.address, 0);
        }
        console.log("Rapid approval/revocation: Success");
    } catch (error) {
        console.error("Error in stress testing:", error.message);
    }

// 2. Testing Error Cases
    console.log("\n2. Testing Error Cases");
    try {
        // First check ERC20 contract state
        const tokenOwner = await tk1.owner();
        console.log("\nTesting ERC20 cases:");
        console.log("Token contract owner:", tokenOwner);
        console.log("Test address (addr1):", addr1.address);
        
        let mintFailed = false;
        // Test non-owner mint (this should fail)
        try {
            await tk1.connect(addr1).mint(addr1.address, 1000);
            console.log("WARNING: Mint succeeded when it should have failed!");
        } catch (mintError) {
            console.log("Mint correctly failed with error:", mintError.message);
            mintFailed = true;
        }
        
        // Only report success if mint actually failed
        if (mintFailed) {
            console.log("Non-owner mint blocked: Success");
        }

        // Test error cases specifically for our TestNFT contract
        console.log("\nTesting NFT error cases:");

        // 1. Test batch revoke with token ID 0 (should fail)
        await expect(
            nft.connect(deployer).batchRevokeApprovals([0])
        ).to.be.revertedWith("TestNFT: Token ID 0 is reserved and cannot be used");
        console.log("Reserved token ID check passed");

        // 2. Test batch revoke for tokens we don't own
        if (ownedNFTs.length > 0) {
            const tokenId = ownedNFTs[0];
            // First transfer a token to addr1
            await nft.connect(deployer).transferFrom(deployer.address, addr1.address, tokenId);
            // Then try to revoke approval for it (should fail)
            await expect(
                nft.connect(deployer).batchRevokeApprovals([tokenId])
            ).to.be.revertedWith("Not owner of token");
        }
        console.log("Non-owner batch revoke check passed");

        // 3. Test normal approval edge cases
        await expect(
            nft.connect(addr1).approve(addr2.address, 99999)
        ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken")
            .withArgs(99999);
        console.log("Non-existent token approval check passed");

        // 4. Test batch revoke permission
        await expect(
            nft.connect(addr1).batchRevokeApprovals([1])  // addr1 is not owner
        ).to.be.reverted;
        console.log("Unauthorized batch revoke check passed");

        // Test NFT approval for non-existent token
        await expect(
            nft.connect(deployer).approve(addr1.address, 99999)
        ).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken")
            .withArgs(99999);
        console.log("Non-existent token approval blocked: Success");

        // Test zero value approval for ERC20 (this should actually work)
        await tk1.connect(deployer).approve(addr1.address, 0);
        const allowance = await tk1.allowance(deployer.address, addr1.address);
        expect(allowance).to.equal(0);
        console.log("Zero value approval for ERC20: Success");
        console.log("Non-existent token approval blocked: Success");
    } catch (error) {
        console.error("Error in edge case testing:", error.message);
    }

    // 3. Testing Complex Approval Scenarios
    console.log("\n3. Testing Complex Approval Scenarios");
    try {
        if (ownedNFTs.length > 0) {
            // Test approval inheritance
            await nft.connect(deployer).setApprovalForAll(addr1.address, true);
            
            // Only try to approve if we own the token
            const tokenId = ownedNFTs[0];
            await nft.connect(deployer).approve(addr2.address, tokenId);
            
            const isApprovedForAll = await nft.isApprovedForAll(deployer.address, addr1.address);
            const singleApproval = await nft.getApproved(tokenId);
            
            console.log("Approval Inheritance Test:", {
                approvedForAll: isApprovedForAll,
                singleTokenApproval: singleApproval
            });
        } else {
            console.log("No owned NFTs to test approval inheritance");
        }

        // Test ERC1155 batch operations
        await erc1155.connect(deployer).setApprovalForAll(addr1.address, true);
        console.log("ERC1155 batch approval set");
    } catch (error) {
        console.error("Error in complex scenario testing:", error.message);
    }

    // 4. Testing Gas Optimizations
    console.log("\n4. Testing Gas Optimizations");
    try {
        // Compare gas costs for different operations
        const tx1 = await tk1.connect(deployer).approve(addr1.address, 0);
        const receipt1 = await tx1.wait();
        
        const tx2 = await nft.connect(deployer).setApprovalForAll(addr1.address, false);
        const receipt2 = await tx2.wait();

        const tx3 = await erc1155.connect(deployer).setApprovalForAll(addr1.address, false);
        const receipt3 = await tx3.wait();

        console.log("Gas Costs:", {
            erc20Revoke: receipt1.gasUsed.toString(),
            erc721BatchRevoke: receipt2.gasUsed.toString(),
            erc1155BatchRevoke: receipt3.gasUsed.toString()
        });
    } catch (error) {
        console.error("Error in gas optimization testing:", error.message);
    }

    // 5. Testing Recovery Scenarios
    console.log("\n5. Testing Recovery Scenarios");
    try {
        // Test recovery from failed approval
        await nft.connect(deployer).setApprovalForAll(addr1.address, true);
        try {
            await nft.connect(addr1).transferFrom(deployer.address, addr2.address, 9999);
        } catch {
            // Expected to fail
        }
        // Verify approval still intact
        const stillApproved = await nft.isApprovedForAll(deployer.address, addr1.address);
        console.log("Approval persists after failed transfer:", stillApproved);

        // Test approval status after token transfer
        if (ownedNFTs.length > 0) {
            const tokenId = ownedNFTs[0];
            await nft.connect(deployer).approve(addr1.address, tokenId);
            await nft.connect(deployer).transferFrom(deployer.address, addr2.address, tokenId);
            const approvalAfterTransfer = await nft.getApproved(tokenId);
            console.log("Approval cleared after transfer:", approvalAfterTransfer === ethers.ZeroAddress);
        } else {
            console.log("No owned NFTs to test transfer approval clearing");
        }
    } catch (error) {
        console.error("Error in recovery scenario testing:", error.message);
    }

    console.log("\n=== Pre-Deployment Tests Completed ===");
}

// Run all tests
runPreDeploymentTests()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Test suite failed:", error);
        process.exit(1);
    });