const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();

    console.log("Owner Address:", owner.address);

    // Load contract ABIs
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const { abi: testERC1155ABI } = require('../src/artifacts/contracts/TestERC1155.sol/TestERC1155.json');

    // Get contract instances
    const tk1 = await ethers.getContractAt(testTokenABI, "0xae246e208ea35b3f23de72b697d47044fc594d5f");
    const tk2 = await ethers.getContractAt(testTokenABI, "0x82bbaa3b0982d88741b275ae1752db85cafe3c65");
    const nft = await ethers.getContractAt(testNFTABI, "0x084815d1330ecc3ef94193a19ec222c0c73dff2d"); // Update this address
    const erc1155 = await ethers.getContractAt(testERC1155ABI, "0x76a999d5f7efde0a300e710e6f52fb0a4b61ad58");

    console.log("Contract Instances Created");

    // Mint more ERC-20 tokens
    await tk1.mint(owner.address, ethers.parseUnits("1000", 18));
    await tk2.mint(owner.address, ethers.parseUnits("1000", 18));
    console.log("Minted 1000 TK1 and TK2 tokens to owner");

    // Mint an NFT
    console.log("Minting NFT to owner...");
    try {
        await nft.safeMint(owner.address);
        console.log("Minted 1 NFT to owner");
    } catch (error) {
        console.error("Error minting NFT:", error);
    }

    // Mint ERC-1155 tokens
    await erc1155.mint(owner.address, 1, 50); // Mint 50 more units of token ID 1
    console.log("Minted 50 ERC1155 tokens (ID 1) to owner");
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

