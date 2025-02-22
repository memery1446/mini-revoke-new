const { ethers } = require("hardhat");

async function checkBalances() {
    const [owner, addr1] = await ethers.getSigners();

    // Load contract ABIs
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const { abi: testERC1155ABI } = require('../src/artifacts/contracts/TestERC1155.sol/TestERC1155.json');

    // Get contract instances
    const tk1 = await ethers.getContractAt(testTokenABI, "0xae246e208ea35b3f23de72b697d47044fc594d5f");
    const tk2 = await ethers.getContractAt(testTokenABI, "0x82bbaa3b0982d88741b275ae1752db85cafe3c65");
    const nft = await ethers.getContractAt(testNFTABI, "0x084815d1330ecc3ef94193a19ec222c0c73dff2d");
    const erc1155 = await ethers.getContractAt(testERC1155ABI, "0x76a999d5f7efde0a300e710e6f52fb0a4b61ad58");

    console.log("\nChecking Token Balances:");
    console.log("Owner TK1 Balance:", (await tk1.balanceOf(owner.address)).toString());
    console.log("addr1 TK1 Balance:", (await tk1.balanceOf(addr1.address)).toString());
    console.log("Owner TK2 Balance:", (await tk2.balanceOf(owner.address)).toString());
    console.log("addr1 TK2 Balance:", (await tk2.balanceOf(addr1.address)).toString());

    console.log("\nChecking NFT Ownership:");
    console.log("Owner NFT Balance:", (await nft.balanceOf(owner.address)).toString());
    console.log("addr1 NFT Balance:", (await nft.balanceOf(addr1.address)).toString());

    console.log("\nChecking ERC1155 Balances:");
    console.log("Owner ERC1155 Token #1 Balance:", (await erc1155.balanceOf(owner.address, 1)).toString());
    console.log("addr1 ERC1155 Token #1 Balance:", (await erc1155.balanceOf(addr1.address, 1)).toString());
}

checkBalances().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

