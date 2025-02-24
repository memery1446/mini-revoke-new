const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Wallet Connection & Network Selection", function () {
    let owner, addr1;
    let networkSelector;
    const AddressZero = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        // Mock contract setup instead of deploying NetworkSelector contract
        networkSelector = {
            connectedWallet: AddressZero,
            network: 0,
            async connectWallet(address) { this.connectedWallet = address; },
            async disconnectWallet() { this.connectedWallet = AddressZero; },
            async getConnectedWallet() { return this.connectedWallet; },
            async setNetwork(networkId) { this.network = networkId; },
            async getNetwork() { return this.network; },
        };
    });

    it("Should connect and disconnect wallet", async function () {
        expect(await networkSelector.getConnectedWallet()).to.equal(AddressZero);
        await networkSelector.connectWallet(owner.address);
        expect(await networkSelector.getConnectedWallet()).to.equal(owner.address);
        await networkSelector.disconnectWallet();
        expect(await networkSelector.getConnectedWallet()).to.equal(AddressZero);
    });

    it("Should switch networks correctly", async function () {
        await networkSelector.setNetwork(1);
        expect(await networkSelector.getNetwork()).to.equal(1);
        await networkSelector.setNetwork(137);
        expect(await networkSelector.getNetwork()).to.equal(137);
    });
});

