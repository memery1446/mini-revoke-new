const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RevokeCash-Like Functionality Tests", function () {
    let owner, addr1, addr2, addr3;
    let testToken, testNFT, testERC1155;
    const AddressZero = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy("Test Token", "TTK", 18);

        const TestNFT = await ethers.getContractFactory("TestNFT");
        testNFT = await TestNFT.deploy();

        const TestERC1155 = await ethers.getContractFactory("TestERC1155");
        testERC1155 = await TestERC1155.deploy(owner.address);
    });

    describe("ERC-20 Approval and Revocation", function () {
        it("Should approve and revoke ERC-20 allowances", async function () {
            await testToken.approve(addr1.address, 1000);
            expect(await testToken.allowance(owner.address, addr1.address)).to.equal(1000);

            await testToken.approve(addr1.address, 0);
            expect(await testToken.allowance(owner.address, addr1.address)).to.equal(0);
        });
    });

    describe("ERC-721 Approval and Revocation", function () {
        it("Should approve and revoke ERC-721 approvals", async function () {
            await testNFT.approve(addr1.address, 1);
            expect(await testNFT.getApproved(1)).to.equal(addr1.address);

            await testNFT.approve(AddressZero, 1);
            expect(await testNFT.getApproved(1)).to.equal(AddressZero);
        });

        it("Should set and revoke ApprovalForAll", async function () {
            await testNFT.setApprovalForAll(addr1.address, true);
            expect(await testNFT.isApprovedForAll(owner.address, addr1.address)).to.be.true;

            await testNFT.setApprovalForAll(addr1.address, false);
            expect(await testNFT.isApprovedForAll(owner.address, addr1.address)).to.be.false;
        });
    });

    describe("ERC-1155 Approval and Revocation", function () {
        it("Should set and revoke ApprovalForAll for ERC-1155", async function () {
            await testERC1155.setApprovalForAll(addr1.address, true);
            expect(await testERC1155.isApprovedForAll(owner.address, addr1.address)).to.be.true;

            await testERC1155.setApprovalForAll(addr1.address, false);
            expect(await testERC1155.isApprovedForAll(owner.address, addr1.address)).to.be.false;
        });
    });

    describe("Batch Revocation", function () {
        it("Should revoke multiple ERC-721 approvals", async function () {
            await testNFT.approve(addr1.address, 1);
            await testNFT.approve(addr1.address, 2);

            await testNFT.batchRevokeApprovals([1, 2]);
            expect(await testNFT.getApproved(1)).to.equal(AddressZero);
            expect(await testNFT.getApproved(2)).to.equal(AddressZero);
        });
    });
});
