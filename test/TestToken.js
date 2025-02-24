const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestToken", function () {
    let TestToken, testToken, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy("Test Token", "TTK", 18); // ✅ Correct deployment
    });

    it("Should deploy with correct initial values", async function () {
        expect(await testToken.name()).to.equal("Test Token");
        expect(await testToken.symbol()).to.equal("TTK");
        expect(await testToken.decimals()).to.equal(18);

        const ownerBalance = await testToken.balanceOf(owner.address);
        expect(ownerBalance).to.equal(ethers.parseUnits("1000000", 18)); // 1,000,000 * 10^18
    });

    it("Should allow owner to mint new tokens", async function () {
        const mintAmount = ethers.parseUnits("1000", 18);
        await testToken.mint(addr1.address, mintAmount);

        const newBalance = await testToken.balanceOf(addr1.address);
        expect(newBalance).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
        const mintAmount = ethers.parseUnits("500", 18);
        await expect(testToken.connect(addr1).mint(addr2.address, mintAmount))
            .to.be.revertedWith("Not authorized");
    });

    it("Should correctly set allowances with approve", async function () {
        const approveAmount = ethers.parseUnits("500", 18);
        await testToken.connect(owner).approve(addr1.address, approveAmount);

        const allowance = await testToken.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(approveAmount);
    });

    it("Should allow spender to transfer within allowance", async function () {
        const approveAmount = ethers.parseUnits("500", 18);
        await testToken.connect(owner).approve(addr1.address, approveAmount);

        await testToken.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);

        const addr2Balance = await testToken.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(approveAmount);
    });

    it("Should not allow spender to exceed allowance", async function () {
        const approveAmount = ethers.parseUnits("500", 18);
        await testToken.connect(owner).approve(addr1.address, approveAmount);

        await expect(
            testToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseUnits("600", 18))
        ).to.be.reverted;
    });
});

