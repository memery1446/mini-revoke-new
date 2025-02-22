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
    const tk1 = await ethers.getContractAt(testTokenABI, "0xef66010868ff77119171628b7efa0f6179779375");
    const tk2 = await ethers.getContractAt(testTokenABI, "0xd544d7a5ef50c510f3e90863828eaba7e392907a");
    const nft = await ethers.getContractAt(testNFTABI, "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b");
    const erc1155 = await ethers.getContractAt(testERC1155ABI, "0x1f585372f116e1055af2bed81a808ddf9638dccd");

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

