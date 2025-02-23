const { ethers } = require("hardhat");

async function main() {
    console.log("Starting comprehensive permission tests...");
    
    const [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    console.log("Test addresses:");
    console.log("Deployer:", deployer.address);
    console.log("Address 1:", addr1.address);
    console.log("Address 2:", addr2.address);
    console.log("Address 3:", addr3.address);

    // Get contract instances
    console.log("\nConnecting to existing contracts...");
    
    // Load contract ABIs
    const { abi: testTokenABI } = require('../src/artifacts/contracts/TestToken.sol/TestToken.json');
    const { abi: testNFTABI } = require('../src/artifacts/contracts/TestNFT.sol/TestNFT.json');
    const { abi: testERC1155ABI } = require('../src/artifacts/contracts/TestERC1155.sol/TestERC1155.json');

    // Contract addresses
    const TOKEN_ADDRESS = "0xef66010868ff77119171628b7efa0f6179779375";
    const NFT_ADDRESS = "0x103416cfcd0d0a32b904ab4fb69df6e5b5aadf2b";
    const ERC1155_ADDRESS = "0x1f585372f116e1055af2bed81a808ddf9638dccd";

    // Get contract instances
    const tk1 = await ethers.getContractAt(testTokenABI, TOKEN_ADDRESS);
    const nft = await ethers.getContractAt(testNFTABI, NFT_ADDRESS);
    const erc1155 = await ethers.getContractAt(testERC1155ABI, ERC1155_ADDRESS);

    console.log("Connected to contracts:");
    console.log("TestToken:", TOKEN_ADDRESS);
    console.log("TestNFT:", NFT_ADDRESS);
    console.log("TestERC1155:", ERC1155_ADDRESS);

    // Check initial balances
    console.log("\nChecking initial balances...");
    const tokenBalance = await tk1.balanceOf(deployer.address);
    const nftBalance = await nft.balanceOf(deployer.address);
    const erc1155Balance = await erc1155.balanceOf(deployer.address, 1);
    
    console.log("Initial balances:");
    console.log("Token balance:", tokenBalance.toString());
    console.log("NFT balance:", nftBalance.toString());
    console.log("ERC1155 token #1 balance:", erc1155Balance.toString());

    // Test ERC20 Permissions
    console.log("\nTesting ERC20 permissions...");
    try {
        // Test infinite approval using ethers.MaxUint256
        const maxUint = ethers.MaxUint256;
        await tk1.connect(deployer).approve(addr1.address, maxUint);
        const infiniteAllowance = await tk1.allowance(deployer.address, addr1.address);
        console.log("Infinite approval set:", infiniteAllowance.toString() === maxUint.toString());

        // Test multiple approvals
        await tk1.connect(deployer).approve(addr1.address, 1000);
        await tk1.connect(deployer).approve(addr2.address, 2000);
        await tk1.connect(deployer).approve(addr3.address, 3000);
        
        const allowance1 = await tk1.allowance(deployer.address, addr1.address);
        const allowance2 = await tk1.allowance(deployer.address, addr2.address);
        const allowance3 = await tk1.allowance(deployer.address, addr3.address);
        
        console.log("Multiple approvals set:", {
            "addr1 allowance": allowance1.toString(),
            "addr2 allowance": allowance2.toString(),
            "addr3 allowance": allowance3.toString()
        });
    } catch (error) {
        console.error("Error in ERC20 tests:", error.message);
    }

    // Test NFT Permissions
    console.log("\nTesting NFT permissions...");
    try {
        // First check NFT ownership
        const tokenId = 1;
        const currentOwner = await nft.ownerOf(tokenId);
        console.log("Current owner of NFT #1:", currentOwner);

        if (currentOwner === deployer.address) {
            // Test approval after transfer
            await nft.connect(deployer).approve(addr1.address, tokenId);
            console.log("Approved addr1 for NFT #1");
            
            await nft.connect(deployer).transferFrom(deployer.address, addr2.address, tokenId);
            console.log("Transferred NFT #1 to addr2");
            
            const approvedAddress = await nft.getApproved(tokenId);
            console.log("Approval status after transfer:", approvedAddress);
        } else {
            console.log("Skipping NFT transfer test as deployer is not the owner");
        }

        // Test approval inheritance
        await nft.connect(deployer).setApprovalForAll(addr1.address, true);
        const isApprovedForAll = await nft.isApprovedForAll(deployer.address, addr1.address);
        console.log("SetApprovalForAll status:", isApprovedForAll);
        
        // Test approval for a specific token ID that deployer owns
        for (let i = 1; i <= 5; i++) {
            try {
                const owner = await nft.ownerOf(i);
                if (owner === deployer.address) {
                    console.log(`Testing approval for NFT #${i} (owned by deployer)`);
                    await nft.connect(deployer).approve(addr2.address, i);
                    const approved = await nft.getApproved(i);
                    console.log(`Approval status for NFT #${i}:`, approved === addr2.address);
                }
            } catch (error) {
                console.log(`NFT #${i} doesn't exist or other error:`, error.message);
            }
        }
        
    } catch (error) {
        console.error("Error in NFT tests:", error.message);
    }

    // Test ERC1155 Permissions
    console.log("\nTesting ERC1155 permissions...");
    try {
        await erc1155.connect(deployer).setApprovalForAll(addr1.address, true);
        const isApprovedForAll = await erc1155.isApprovedForAll(deployer.address, addr1.address);
        console.log("ERC1155 approval set correctly:", isApprovedForAll);

        // Test batch balance checking
        const tokenIds = [1, 2, 3, 4, 5];
        const balances = await Promise.all(
            tokenIds.map(id => erc1155.balanceOf(deployer.address, id))
        );
        console.log("ERC1155 balances for tokens 1-5:", 
            tokenIds.reduce((acc, id, index) => {
                acc[id] = balances[index].toString();
                return acc;
            }, {})
        );

    } catch (error) {
        console.error("Error in ERC1155 tests:", error.message);
    }

    // Test Gas Usage
    console.log("\nMeasuring gas usage...");
    try {
        const tx = await tk1.connect(deployer).approve(addr1.address, 0);
        const receipt = await tx.wait();
        console.log("Gas used for ERC20 approval revocation:", receipt.gasUsed.toString());

        // Test NFT approval gas
        const ownedNFTs = [];
        for (let i = 1; i <= 5; i++) {
            try {
                const owner = await nft.ownerOf(i);
                if (owner === deployer.address) {
                    ownedNFTs.push(i);
                }
            } catch (error) {} // Ignore errors for non-existent tokens
        }

        if (ownedNFTs.length > 0) {
            const nftTx = await nft.connect(deployer).approve(addr1.address, ownedNFTs[0]);
            const nftReceipt = await nftTx.wait();
            console.log("Gas used for NFT approval:", nftReceipt.gasUsed.toString());
        }

    } catch (error) {
        console.error("Error measuring gas:", error.message);
    }

    console.log("\nAll tests completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in test execution:", error);
        process.exit(1);
    });