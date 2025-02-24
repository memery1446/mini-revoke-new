const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestNFT", function () {
    let TestNFT, testNFT, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        TestNFT = await ethers.getContractFactory("TestNFT");
        testNFT = await TestNFT.deploy();
    });

    it("Should deploy with correct initial values", async function () {
        expect(await testNFT.name()).to.equal("TestNFT");
        expect(await testNFT.symbol()).to.equal("TNFT");

        expect(await testNFT.ownerOf(1)).to.equal(owner.address);
        expect(await testNFT.ownerOf(2)).to.equal(owner.address);
        expect(await testNFT.ownerOf(3)).to.equal(owner.address);
    });

    it("Should allow owner to mint new NFTs", async function () {
        await testNFT.safeMint(addr1.address);
        const tokenId = await testNFT.totalSupply();

        expect(await testNFT.ownerOf(tokenId)).to.equal(addr1.address);
    });

    it("Should not allow non-owner to mint", async function () {
        await expect(testNFT.connect(addr1).safeMint(addr2.address))
            .to.be.reverted;
    });

    it("Should correctly set approvals", async function () {
        await testNFT.approve(addr1.address, 1);
        expect(await testNFT.getApproved(1)).to.equal(addr1.address);
    });

    it("Should correctly set and check operator approvals", async function () {
        await testNFT.setApprovalForAll(addr1.address, true);
        expect(await testNFT.isApprovedForAll(owner.address, addr1.address)).to.be.true;
    });

    it("Should allow approved user to transfer NFTs", async function () {
        await testNFT.approve(addr1.address, 1);
        await testNFT.connect(addr1).transferFrom(owner.address, addr2.address, 1);

        expect(await testNFT.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should not allow non-approved user to transfer NFTs", async function () {
        await expect(testNFT.connect(addr1).transferFrom(owner.address, addr2.address, 2))
            .to.be.reverted;
    });

    it("Should allow owner to batch revoke approvals", async function () {
        await testNFT.approve(addr1.address, 1);
        await testNFT.approve(addr1.address, 2);

        await testNFT.batchRevokeApprovals([1, 2]);

        expect(await testNFT.getApproved(1)).to.equal(ethers.ZeroAddress);
        expect(await testNFT.getApproved(2)).to.equal(ethers.ZeroAddress);
    });

    it("Should not allow non-owner to revoke approvals", async function () {
        await testNFT.approve(addr1.address, 1);
        await expect(testNFT.connect(addr1).batchRevokeApprovals([1]))
            .to.be.reverted;
    });

    it("Should not fail when revoking an already unapproved token", async function () {
        await testNFT.batchRevokeApprovals([3]); // Token 3 has no approval set
        expect(await testNFT.getApproved(3)).to.equal(ethers.ZeroAddress);
    });
});


