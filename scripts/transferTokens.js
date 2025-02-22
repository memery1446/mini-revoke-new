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
    const tk1 = await ethers.getContractAt(testTokenABI, "0xef66010868ff77119171628b7efa0f6179779375");
    const tk2 = await ethers.getContractAt(testTokenABI, "0xd544d7a5ef50c510f3e90863828eaba7e392907a");
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b");
    const erc1155 = await ethers.getContractAt(testERC1155ABI, "0x1f585372f116e1055af2bed81a808ddf9638dccd");

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