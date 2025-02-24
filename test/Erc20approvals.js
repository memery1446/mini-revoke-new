const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC-20 Allowance Management", function () {
    let owner, addr1, testToken;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy("Test Token", "TTK", 18);
    });

    it("Should set and check allowance", async function () {
        await testToken.approve(addr1.address, 1000);
        expect(await testToken.allowance(owner.address, addr1.address)).to.equal(1000);
    });

    it("Should revoke allowance", async function () {
        await testToken.approve(addr1.address, 1000);
        await testToken.approve(addr1.address, 0);
        expect(await testToken.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should prevent unauthorized spending", async function () {
        await expect(
            testToken.connect(addr1).transferFrom(owner.address, addr1.address, 500)
        ).to.be.reverted;
    });
});

