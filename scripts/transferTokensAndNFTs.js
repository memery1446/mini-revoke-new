const { ethers } = require("hardhat");

async function transferTokensAndNFTs() {
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
    console.log("Transferring 500 TK1 to addr1...");
    await tk1.transfer(addr1.address, ethers.parseUnits("500", 18)); // Transfer 500 TK1
    console.log("Transferring 500 TK2 to addr1...");
    await tk2.transfer(addr1.address, ethers.parseUnits("500", 18)); // Transfer 500 TK2
    console.log("Transferred 500 TK1 and TK2 tokens to addr1");

    // Check NFT ownership
    const nftBalance = await nft.balanceOf(owner.address);
    console.log("Owner NFT Balance:", nftBalance.toString());

    if (nftBalance > 0) {
        // Get the first token ID owned by the owner
        const tokenId = await nft.tokenOfOwnerByIndex(owner.address, 0);
        console.log("First NFT Token ID owned by owner:", tokenId.toString());

        // Transfer the NFT
        console.log(`Transferring NFT (ID ${tokenId}) to addr1...`);
        await nft.transferFrom(owner.address, addr1.address, tokenId); // Transfer the NFT
        console.log(`Transferred NFT (ID ${tokenId}) to addr1`);
    } else {
        console.log("Owner does not own any NFTs. Minting one...");
        // Mint an NFT to the owner
        await nft.safeMint(owner.address);
        console.log("Minted NFT to owner.");

        // Get the newly minted token ID
        const tokenId = await nft.tokenOfOwnerByIndex(owner.address, 0);
        console.log("Newly Minted NFT Token ID:", tokenId.toString());

        // Transfer the NFT
        console.log(`Transferring NFT (ID ${tokenId}) to addr1...`);
        await nft.transferFrom(owner.address, addr1.address, tokenId); // Transfer the NFT
        console.log(`Transferred NFT (ID ${tokenId}) to addr1`);
    }

    // Transfer ERC1155 tokens
    console.log("Transferring 50 ERC1155 tokens (ID 1) to addr1...");
    await erc1155.safeTransferFrom(owner.address, addr1.address, 1, 50, "0x"); // Transfer 50 units of token ID 1
    console.log("Transferred 50 ERC1155 tokens (ID 1) to addr1");
}

transferTokensAndNFTs().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

