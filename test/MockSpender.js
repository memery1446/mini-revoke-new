const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockSpender", function () {
    let MockSpender, mockSpender, TestToken, testToken, TestNFT, testNFT, TestERC1155, testERC1155;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy MockSpender
        MockSpender = await ethers.getContractFactory("MockSpender");
        mockSpender = await MockSpender.deploy();

        // Deploy Test ERC-20 Token
        TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy("Test Token", "TTK", 18);

        // Deploy Test ERC-721 NFT
        TestNFT = await ethers.getContractFactory("TestNFT");
        testNFT = await TestNFT.deploy();

        // Deploy Test ERC-1155 NFT
        TestERC1155 = await ethers.getContractFactory("TestERC1155");
        testERC1155 = await TestERC1155.deploy(owner.address);
    });

    describe("ERC-20 Approvals", function () {
        it("Should approve ERC-20 token spending", async function () {
            await testToken.connect(owner).approve(addr1.address, ethers.parseUnits("100", 18));

            expect(await testToken.allowance(owner.address, addr1.address)).to.equal(ethers.parseUnits("100", 18));
        });

        it("Should check ERC-20 allowance", async function () {
            await testToken.connect(owner).approve(addr1.address, ethers.parseUnits("50", 18));
            const allowance = await mockSpender.checkERC20Allowance(testToken.target, addr1.address);
            expect(allowance).to.equal(ethers.parseUnits("50", 18));
        });
    });

    describe("ERC-721 Approvals", function () {
        it("Should approve ERC-721 operator", async function () {
            await testNFT.connect(owner).setApprovalForAll(addr1.address, true);
            expect(await testNFT.isApprovedForAll(owner.address, addr1.address)).to.be.true;
        });

        it("Should check ERC-721 approval status", async function () {
            await testNFT.connect(owner).setApprovalForAll(addr1.address, true);
            expect(await mockSpender.checkERC721Approval(testNFT.target, addr1.address)).to.be.true;
        });
    });

    describe("ERC-1155 Approvals", function () {
        it("Should approve ERC-1155 operator", async function () {
            await testERC1155.connect(owner).setApprovalForAll(addr1.address, true);
            expect(await testERC1155.isApprovedForAll(owner.address, addr1.address)).to.be.true;
        });

        it("Should check ERC-1155 approval status", async function () {
            await testERC1155.connect(owner).setApprovalForAll(addr1.address, true);
            expect(await mockSpender.checkERC1155Approval(testERC1155.target, addr1.address)).to.be.true;
        });
    });

    describe("Error Handling", function () {
        it("Should revert if approving ERC-20 with invalid address", async function () {
            await expect(mockSpender.approveERC20(ethers.ZeroAddress, addr1.address, 100))
                .to.be.revertedWith("Invalid address");
        });

        it("Should revert if approving ERC-721 with invalid address", async function () {
            await expect(mockSpender.approveERC721(ethers.ZeroAddress, addr1.address, true))
                .to.be.revertedWith("Invalid address");
        });

        it("Should revert if approving ERC-1155 with invalid address", async function () {
            await expect(mockSpender.approveERC1155(ethers.ZeroAddress, addr1.address, true))
                .to.be.revertedWith("Invalid address");
        });
    });
});
