require("dotenv").config();
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    // Get your mock spender address
    const { CONTRACT_ADDRESSES } = require("../src/constants/abis");
    const MOCK_SPENDER = CONTRACT_ADDRESSES.MockSpender;
    
    console.log(`📋 APPROVAL VERIFICATION REPORT`);
    console.log(`==============================`);
    console.log(`Spender address: ${MOCK_SPENDER}`);
    
    // Get original account
    const [deployer] = await ethers.getSigners();
    console.log(`\nChecking from Hardhat account: ${deployer.address}`);
    
    // Define accounts to check
    const accounts = [
        {
            name: "Hardhat Account",
            address: deployer.address
        },
        {
            name: "USDC Whale",
            address: "0x55fe002aeff02f77364de339a1292923a15844b8"
        },
        {
            name: "WETH Whale",
            address: "0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2"
        }
    ];
    
    // Define tokens to check
    const tokens = [
        {
            name: "USDC",
            address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            type: "ERC20",
            decimals: 6
        },
        {
            name: "WETH",
            address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            type: "ERC20",
            decimals: 18
        },
        {
            name: "TestNFT",
            address: CONTRACT_ADDRESSES.TestNFT,
            type: "ERC721",
            tokens: [1, 2, 3]
        },
        {
            name: "ERC1155",
            address: CONTRACT_ADDRESSES.ERC1155,
            type: "ERC1155"
        }
    ];
    
    // Check all approvals for all accounts and tokens
    for (const account of accounts) {
        console.log(`\n🔍 Checking approvals for ${account.name} (${account.address})`);
        
        for (const token of tokens) {
            console.log(`\n  ${token.name} (${token.address})`);
            
            if (token.type === "ERC20") {
                await checkERC20Approval(token, account.address, MOCK_SPENDER);
            } else if (token.type === "ERC721") {
                await checkERC721Approval(token, account.address, MOCK_SPENDER);
            } else if (token.type === "ERC1155") {
                await checkERC1155Approval(token, account.address, MOCK_SPENDER);
            }
        }
    }
    
    console.log(`\n📋 APPROVAL CHECK COMPLETE`);
    console.log(`\nUse this information to compare with your UI.`);
    console.log(`If the UI doesn't match this data, check the following:`);
    console.log(`1. Is your UI looking at the right accounts?`);
    console.log(`2. Is your UI connected to the same network?`);
    console.log(`3. Try refreshing your UI or clearing its cache`);
    console.log(`4. Ensure your contract ABIs match between script and UI`);
}

// Check ERC20 approval
async function checkERC20Approval(token, ownerAddress, spenderAddress) {
    try {
        // Low-level direct call to avoid ABI issues
        const provider = ethers.provider;
        
        // Create allowance(address,address) call
        const allowanceFunc = "0xdd62ed3e";
        const encodedOwner = ethers.utils?.defaultAbiCoder ? 
            ethers.utils.defaultAbiCoder.encode(["address"], [ownerAddress]).slice(2) :
            ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ownerAddress]).slice(2);
            
        const encodedSpender = ethers.utils?.defaultAbiCoder ?
            ethers.utils.defaultAbiCoder.encode(["address"], [spenderAddress]).slice(2) :
            ethers.AbiCoder.defaultAbiCoder().encode(["address"], [spenderAddress]).slice(2);
            
        const data = allowanceFunc + encodedOwner + encodedSpender;
        
        const result = await provider.call({
            to: token.address,
            data
        });
        
        // Parse the result
        let allowance;
        if (result && result !== "0x") {
            allowance = ethers.BigNumber.from(result);
            
            // Format if needed
            const formatted = token.decimals ? 
                ethers.utils.formatUnits(allowance, token.decimals) : 
                allowance.toString();
                
            console.log(`    ✅ Allowance: ${formatted}`);
            console.log(`    Status: ${allowance.gt(0) ? "APPROVED" : "NOT APPROVED"}`);
        } else {
            console.log(`    ❌ Could not get allowance`);
        }
    } catch (error) {
        console.log(`    ❌ Error checking allowance: ${error.message}`);
        
        // Try with a direct contract approach as fallback
        try {
            const contract = new ethers.Contract(token.address, 
                ["function allowance(address,address) view returns (uint256)"], 
                ethers.provider);
            
            const allowance = await contract.allowance(ownerAddress, spenderAddress);
            console.log(`    ✅ Allowance (backup method): ${allowance.toString()}`);
        } catch (fallbackError) {
            console.log(`    ❌ Backup method also failed: ${fallbackError.message}`);
        }
    }
}

// Check ERC721 approval
async function checkERC721Approval(token, ownerAddress, spenderAddress) {
    // First try isApprovedForAll
    try {
        // Create isApprovedForAll(address,address) call
        const isApprovedForAllFunc = "0xe985e9c5";
        const encodedOwner = ethers.utils?.defaultAbiCoder ? 
            ethers.utils.defaultAbiCoder.encode(["address"], [ownerAddress]).slice(2) :
            ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ownerAddress]).slice(2);
            
        const encodedSpender = ethers.utils?.defaultAbiCoder ?
            ethers.utils.defaultAbiCoder.encode(["address"], [spenderAddress]).slice(2) :
            ethers.AbiCoder.defaultAbiCoder().encode(["address"], [spenderAddress]).slice(2);
            
        const data = isApprovedForAllFunc + encodedOwner + encodedSpender;
        
        const result = await ethers.provider.call({
            to: token.address,
            data
        });
        
        if (result && result !== "0x") {
            const isApproved = parseInt(result) !== 0;
            console.log(`    ✅ Approval for all: ${isApproved ? "APPROVED" : "NOT APPROVED"}`);
        } else {
            console.log(`    ❌ Could not check isApprovedForAll`);
        }
    } catch (error) {
        console.log(`    ❌ Error checking isApprovedForAll: ${error.message}`);
    }
    
    // Then check individual token approvals
    if (token.tokens && token.tokens.length > 0) {
        for (const tokenId of token.tokens) {
            try {
                // Create getApproved(uint256) call
                const getApprovedFunc = "0x081812fc";
                const encodedTokenId = ethers.utils?.defaultAbiCoder ? 
                    ethers.utils.defaultAbiCoder.encode(["uint256"], [tokenId]).slice(2) :
                    ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [tokenId]).slice(2);
                    
                const data = getApprovedFunc + encodedTokenId;
                
                const result = await ethers.provider.call({
                    to: token.address,
                    data
                });
                
                if (result && result !== "0x") {
                    // Parse address from result (last 20 bytes)
                    const approved = "0x" + result.slice(26);
                    const isApproved = approved.toLowerCase() === spenderAddress.toLowerCase();
                    
                    console.log(`    Token #${tokenId}: ${isApproved ? "APPROVED" : "NOT APPROVED"} to ${approved}`);
                } else {
                    console.log(`    ❌ Could not check approval for token #${tokenId}`);
                }
            } catch (error) {
                console.log(`    ❌ Error checking token #${tokenId}: ${error.message}`);
            }
        }
    }
}

// Check ERC1155 approval
async function checkERC1155Approval(token, ownerAddress, spenderAddress) {
    try {
        // Create isApprovedForAll(address,address) call
        const isApprovedForAllFunc = "0xe985e9c5";
        const encodedOwner = ethers.utils?.defaultAbiCoder ? 
            ethers.utils.defaultAbiCoder.encode(["address"], [ownerAddress]).slice(2) :
            ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ownerAddress]).slice(2);
            
        const encodedSpender = ethers.utils?.defaultAbiCoder ?
            ethers.utils.defaultAbiCoder.encode(["address"], [spenderAddress]).slice(2) :
            ethers.AbiCoder.defaultAbiCoder().encode(["address"], [spenderAddress]).slice(2);
            
        const data = isApprovedForAllFunc + encodedOwner + encodedSpender;
        
        const result = await ethers.provider.call({
            to: token.address,
            data
        });
        
        if (result && result !== "0x") {
            const isApproved = parseInt(result) !== 0;
            console.log(`    ✅ Approval for all: ${isApproved ? "APPROVED" : "NOT APPROVED"}`);
        } else {
            console.log(`    ❌ Could not check isApprovedForAll`);
        }
    } catch (error) {
        console.log(`    ❌ Error checking isApprovedForAll: ${error.message}`);
    }
}

main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});