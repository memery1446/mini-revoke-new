const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();

    console.log("Owner Address:", owner.address);

    // Load contract ABIs
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const { abi: testERC1155ABI } = require('../src/artifacts/contracts/TestERC1155.sol/TestERC1155.json');

    console.log("ABIs Loaded Successfully");

    // Get contract instances
    const tk1 = await ethers.getContractAt(testTokenABI, "0xef66010868ff77119171628b7efa0f6179779375");
    const tk2 = await ethers.getContractAt(testTokenABI, "0xd544d7a5ef50c510f3e90863828eaba7e392907a");
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b"); // Update this address
    const erc1155 = await ethers.getContractAt(testERC1155ABI, "0x1f585372f116e1055af2bed81a808ddf9638dccd");

    console.log("Contract Instances Created");

    // Debugging: Log the contract instance and its properties
    console.log("NFT Contract Instance:", nft);
    console.log("NFT Contract Interface:", nft.interface);

    // Debugging: Check if the ABI is correctly applied
    if (nft.interface && nft.interface.fragments) {
        console.log("ABI Fragments:", nft.interface.fragments);
    } else {
        console.error("ABI Fragments are missing or invalid.");
    }

    // Debugging: Check if safeMint exists
    if (nft.interface && nft.interface.getFunction("safeMint")) {
        console.log("safeMint function exists in the ABI.");
    } else {
        console.error("safeMint function is missing in the ABI.");
    }

    // Mint more ERC-20 tokens
    await tk1.mint(owner.address, ethers.parseUnits("1000", 18));
    await tk2.mint(owner.address, ethers.parseUnits("1000", 18));
    console.log("Minted 1000 TK1 and TK2 tokens to owner");

    // Mint an NFT
    console.log("Minting NFT to owner...");
    try {
        if (nft.interface && nft.interface.getFunction("safeMint")) {
            const tx = await nft.safeMint(owner.address);
            await tx.wait(); // Wait for the transaction to be mined
            console.log("Minted 1 NFT to owner");
        } else {
            console.error("safeMint is not a function on the NFT contract instance.");
        }
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

