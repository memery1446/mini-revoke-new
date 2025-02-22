const { ethers } = require("hardhat");

async function main() {
    const [owner, addr1] = await ethers.getSigners();

    console.log("Owner Address:", owner.address);
    console.log("addr1 Address:", addr1.address);

    // Load contract ABIs
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const { abi: testERC1155ABI } = require('../src/artifacts/contracts/TestERC1155.sol/TestERC1155.json');

    // Get contract instances
    const tk1 = await ethers.getContractAt(testTokenABI, "0xae246e208ea35b3f23de72b697d47044fc594d5f");
    const tk2 = await ethers.getContractAt(testTokenABI, "0x82bbaa3b0982d88741b275ae1752db85cafe3c65");
    const nft = await ethers.getContractAt(testNFTABI, "0x084815d1330ecc3ef94193a19ec222c0c73dff2d");
    const erc1155 = await ethers.getContractAt(testERC1155ABI, "0x76a999d5f7efde0a300e710e6f52fb0a4b61ad58");

    console.log("Contract Instances Created");

    // Transfer ERC-20 tokens
    console.log("Transferring 100 TK1 to addr1...");
    await tk1.transfer(addr1.address, ethers.parseUnits("100", 18));
    console.log("Transferring 100 TK2 to addr1...");
    await tk2.transfer(addr1.address, ethers.parseUnits("100", 18));
    console.log("Transferred 100 TK1 and TK2 tokens to addr1");

    // Transfer an NFT
    console.log("Transferring NFT (ID 0) to addr1...");
    await nft.transferFrom(owner.address, addr1.address, 0); // Transfer NFT with token ID 0
    console.log("Transferred NFT (ID 0) to addr1");

    // Transfer ERC-1155 tokens
    console.log("Transferring 10 ERC1155 tokens (ID 1) to addr1...");
    await erc1155.safeTransferFrom(owner.address, addr1.address, 1, 10, "0x"); // Transfer 10 units of token ID 1
    console.log("Transferred 10 ERC1155 tokens (ID 1) to addr1");
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});