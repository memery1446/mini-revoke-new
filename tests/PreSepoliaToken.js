const { ethers } = require("hardhat");
const { expect } = require("chai");

async function testERC20() {
    console.log("\n=== Running ERC20 Pre-Deployment Tests ===\n");
    
    const [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Get contract instance
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const tk1 = await ethers.getContractAt(testTokenABI, "0xef66010868ff77119171628b7efa0f6179779375");
    
    console.log("Testing with addresses:");
    console.log("Deployer:", deployer.address);
    console.log("Test address 1:", addr1.address);

    // 1. Basic State Tests
    console.log("\n1. Basic State Tests");
    try {
        const owner = await tk1.owner();
        const balance = await tk1.balanceOf(deployer.address);
        console.log("Contract owner:", owner);
        console.log("Owner balance:", balance.toString());
    } catch (error) {
        console.error("Error in basic state tests:", error.message);
    }

    // 2. Approval Tests
    console.log("\n2. Approval Tests");
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

        // Test zero value approval
        await tk1.connect(deployer).approve(addr1.address, 0);
        const allowance = await tk1.allowance(deployer.address, addr1.address);
        expect(allowance).to.equal(0);
        console.log("Zero value approval: Success");
    } catch (error) {
        console.error("Error in approval tests:", error.message);
    }

    // 3. Permission Tests
    console.log("\n3. Permission Tests");
    try {
        let mintFailed = false;
        try {
            await tk1.connect(addr1).mint(addr1.address, 1000);
            console.log("WARNING: Mint succeeded when it should have failed!");
        } catch (mintError) {
            console.log("Mint correctly failed with error:", mintError.message);
            mintFailed = true;
        }
        
        if (mintFailed) {
            console.log("Non-owner mint blocked: Success");
        }
    } catch (error) {
        console.error("Error in permission tests:", error.message);
    }

    // 4. Gas Tests
    console.log("\n4. Gas Tests");
    try {
        // Test approval gas
        const tx1 = await tk1.connect(deployer).approve(addr1.address, 1000);
        const receipt1 = await tx1.wait();
        
        // Test revocation gas
        const tx2 = await tk1.connect(deployer).approve(addr1.address, 0);
        const receipt2 = await tx2.wait();

        console.log("Gas Costs:", {
            approve: receipt1.gasUsed.toString(),
            revoke: receipt2.gasUsed.toString()
        });
    } catch (error) {
        console.error("Error in gas tests:", error.message);
    }

    console.log("\n=== ERC20 Pre-Deployment Tests Completed ===");
}

// Run the tests
testERC20()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Test suite failed:", error);
        process.exit(1);
    });