const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Existing Approvals Fetching & Verification", function () {
    let owner, addr1, testToken, testNFT, testERC1155;
    const AddressZero = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy("Test Token", "TTK", 18);
        const TestNFT = await ethers.getContractFactory("TestNFT");
        testNFT = await TestNFT.deploy();
        const TestERC1155 = await ethers.getContractFactory("TestERC1155");
        testERC1155 = await TestERC1155.deploy(owner.address);
    });

    it("Should fetch ERC-20 approvals correctly", async function () {
        await testToken.approve(addr1.address, 500);
        const allowance = await testToken.allowance(owner.address, addr1.address);
        expect(allowance).to.equal(500);
    });

    it("Should fetch ERC-721 approvals correctly", async function () {
        await testNFT.approve(addr1.address, 1);
        expect(await testNFT.getApproved(1)).to.equal(addr1.address);
    });

    it("Should fetch ERC-1155 approvals correctly", async function () {
        await testERC1155.setApprovalForAll(addr1.address, true);
        expect(await testERC1155.isApprovedForAll(owner.address, addr1.address)).to.be.true;
    });

    it("Should verify approvals reset after revocation", async function () {
        await testToken.approve(addr1.address, 500);
        await testNFT.approve(addr1.address, 1);
        await testERC1155.setApprovalForAll(addr1.address, true);
        
        await testToken.approve(addr1.address, 0);
        await testNFT.approve(AddressZero, 1);
        await testERC1155.setApprovalForAll(addr1.address, false);
        
        expect(await testToken.allowance(owner.address, addr1.address)).to.equal(0);
        expect(await testNFT.getApproved(1)).to.equal(AddressZero);
        expect(await testERC1155.isApprovedForAll(owner.address, addr1.address)).to.be.false;
    });
});

