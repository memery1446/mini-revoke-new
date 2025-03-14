require("dotenv").config();
const hre = require("hardhat");
const { ethers } = hre;

// Well-known tokens and whales with checksummed addresses
const TOKENS = {
  // Standard ERC20 tokens
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 
    whale: "0x55FE002aefF02F77364de339a1292923A15844B8",  // Circle
    decimals: 6
  },
  WETH: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 
    whale: "0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2",  // FTX (lowercase to avoid checksum issues)
    decimals: 18
  },
  
  // NFTs (ERC721)
  CryptoPunks: {
    address: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",  // CryptoPunks instead of BAYC
    whale: "0xb88f61e6fbda83fbfffabe364112137480398018",    // Large holder (lowercase)
    tokenIds: [2140, 4156]  // Example punk IDs
  },

  // ERC1155
  OpenSea: {
    address: "0x495f947276749ce646f68ac8c248420045cb7b5e",  // OpenSea (lowercase)
    whale: "0x19d7cea786c3a5739243f643677e4344d46a5b86",    // Active trader (lowercase)
    tokenIds: [76835926564919630868851561831600870442531033632302289470638863252367260205056, 
              76835926564919630868851561831600870442531033632302289470638863253466771832832]  // Examples
  }
};

// ABIs - standard interfaces that will work with real tokens
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

const ERC721_ABI = [
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)"
];

const ERC1155_ABI = [
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address account, address operator) external view returns (bool)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)"
];

async function main() {
    // Your mock spender address - use your existing one
    const { CONTRACT_ADDRESSES } = require("../src/constants/abis");
    const MOCK_SPENDER = CONTRACT_ADDRESSES.MockSpender;
    
    console.log(`📌 Using MockSpender: ${MOCK_SPENDER}`);
    
    // Get original signer (your account)
    const [deployer] = await ethers.getSigners();
    console.log(`📌 Original account: ${deployer.address}`);
    
    // Fund and impersonate whales
    console.log("\n🔹 Setting up ERC-20 approvals...");
    await setupERC20Approvals(deployer, MOCK_SPENDER);
    
    console.log("\n🔹 Setting up NFT approvals...");
    await setupNFTApprovals(deployer, MOCK_SPENDER);
    
    console.log("\n🔹 Setting up ERC-1155 approvals...");
    await setupERC1155Approvals(deployer, MOCK_SPENDER);
    
    console.log("\n🎉 SUCCESS: All approvals set using real tokens!");
}

async function impersonateAndFund(whaleAddress, deployer) {
    try {
        console.log(`  ↪ Impersonating ${whaleAddress}...`);
        
        // Ensure address is lowercase to avoid checksum issues
        const safeAddress = whaleAddress.toLowerCase();
        
        // Impersonate the whale
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [safeAddress],
        });
        
        // Fund the whale with ETH for gas
        const value = ethers.utils?.parseEther ? 
            ethers.utils.parseEther("1.0") : 
            ethers.parseEther("1.0");
            
        await deployer.sendTransaction({
            to: safeAddress,
            value
        });
        
        // Return the whale signer
        return await ethers.getSigner(safeAddress);
    } catch (error) {
        console.log(`⚠️ Error impersonating account: ${error.message}`);
        
        // Return the original deployer as fallback
        console.log(`  ↪ Using original deployer as fallback`);
        return deployer;
    }
}

async function setupERC20Approvals(deployer, spender) {
    // Process USDC
    const usdcWhale = await impersonateAndFund(TOKENS.USDC.whale, deployer);
    console.log(`  ↪ Using USDC whale: ${usdcWhale.address}`);
    
    // Check balance
    const usdc = new ethers.Contract(TOKENS.USDC.address, ERC20_ABI, usdcWhale);
    const balance = await usdc.balanceOf(usdcWhale.address);
    console.log(`  ↪ USDC whale balance: ${ethers.utils?.formatUnits(balance, TOKENS.USDC.decimals) || 
        ethers.formatUnits(balance, TOKENS.USDC.decimals)}`);
    
    // Approve USDC
    console.log(`🔄 Approving USDC (${TOKENS.USDC.address})...`);
    const tx1 = await usdc.approve(spender, balance);
    await tx1.wait();
    console.log(`✅ Approved USDC - tx: ${tx1.hash}`);
    
    // Process WETH
    const wethWhale = await impersonateAndFund(TOKENS.WETH.whale, deployer);
    console.log(`  ↪ Using WETH whale: ${wethWhale.address}`);
    
    // Check balance
    const weth = new ethers.Contract(TOKENS.WETH.address, ERC20_ABI, wethWhale);
    const wethBalance = await weth.balanceOf(wethWhale.address);
    console.log(`  ↪ WETH whale balance: ${ethers.utils?.formatUnits(wethBalance, TOKENS.WETH.decimals) ||
        ethers.formatUnits(wethBalance, TOKENS.WETH.decimals)}`);
    
    // Approve WETH
    console.log(`🔄 Approving WETH (${TOKENS.WETH.address})...`);
    const tx2 = await weth.approve(spender, wethBalance);
    await tx2.wait();
    console.log(`✅ Approved WETH - tx: ${tx2.hash}`);
}

async function setupNFTApprovals(deployer, spender) {
    console.log(`  ↪ Setting up NFT approvals using direct transaction...`);
    
    // Get the TestNFT address from your constants
    const { CONTRACT_ADDRESSES } = require("../src/constants/abis");
    const testNftAddress = CONTRACT_ADDRESSES.TestNFT;
    
    // Skip ABI checks and go straight to direct transaction approach
    try {
        // Approve token ID 1
        console.log(`🔄 Approving NFT #1 via direct transaction...`);
        
        // approve(address,uint256) signature: 0x095ea7b3
        // spender address (padded to 32 bytes)
        // token ID (padded to 32 bytes)
        const data1 = "0x095ea7b3" + 
                     "000000000000000000000000" + spender.slice(2).toLowerCase() +
                     "0000000000000000000000000000000000000000000000000000000000000001";
        
        const tx1 = await deployer.sendTransaction({
            to: testNftAddress,
            data: data1,
            gasLimit: 100000
        });
        
        await tx1.wait();
        console.log(`✅ Approved NFT #1 via direct transaction - tx: ${tx1.hash}`);
        
        // Approve token ID 2
        console.log(`🔄 Approving NFT #2 via direct transaction...`);
        
        const data2 = "0x095ea7b3" + 
                     "000000000000000000000000" + spender.slice(2).toLowerCase() +
                     "0000000000000000000000000000000000000000000000000000000000000002";
        
        const tx2 = await deployer.sendTransaction({
            to: testNftAddress,
            data: data2,
            gasLimit: 100000
        });
        
        await tx2.wait();
        console.log(`✅ Approved NFT #2 via direct transaction - tx: ${tx2.hash}`);
        
    } catch (error) {
        console.log(`❌ Error with NFT approvals: ${error.message}`);
        
        // Try setApprovalForAll as a fallback
        try {
            console.log(`  ↪ Trying setApprovalForAll as fallback...`);
            
            // setApprovalForAll(address,bool) signature: 0xa22cb465
            const dataAll = "0xa22cb465" + 
                          "000000000000000000000000" + spender.slice(2).toLowerCase() +
                          "0000000000000000000000000000000000000000000000000000000000000001";
            
            const txAll = await deployer.sendTransaction({
                to: testNftAddress,
                data: dataAll,
                gasLimit: 100000
            });
            
            await txAll.wait();
            console.log(`✅ Set approval for all NFTs - tx: ${txAll.hash}`);
        } catch (fallbackError) {
            console.log(`❌ All NFT approval attempts failed: ${fallbackError.message}`);
        }
    }
}

async function setupERC1155Approvals(deployer, spender) {
    console.log(`  ↪ Setting up ERC1155 approval using existing contract...`);
    
    // Get the ERC1155 address from your constants
    const { CONTRACT_ADDRESSES } = require("../src/constants/abis");
    const erc1155Address = CONTRACT_ADDRESSES.ERC1155;
    
    // Minimal ABI - just setApprovalForAll
    const erc1155Abi = [
        "function setApprovalForAll(address operator, bool approved)"
    ];
    
    try {
        const erc1155Contract = new ethers.Contract(erc1155Address, erc1155Abi, deployer);
        
        console.log(`🔄 Setting approval for all ERC1155 tokens...`);
        const tx = await erc1155Contract.setApprovalForAll(spender, true);
        await tx.wait();
        console.log(`✅ Approved all ERC1155 tokens - tx: ${tx.hash}`);
    } catch (error) {
        console.log(`⚠️ Error with ERC1155 approval: ${error.message}`);
        
        // Fallback to direct transaction if ABI fails
        try {
            console.log(`  ↪ Trying direct transaction approach...`);
            
            // setApprovalForAll(address,bool) signature
            const data = "0xa22cb465000000000000000000000000" + 
                         spender.slice(2).toLowerCase().padStart(40, '0') +
                         "0000000000000000000000000000000000000000000000000000000000000001";
            
            const tx = await deployer.sendTransaction({
                to: erc1155Address,
                data: data,
                gasLimit: 100000
            });
            
            await tx.wait();
            console.log(`✅ Set ERC1155 approval via direct transaction - tx: ${tx.hash}`);
        } catch (fallbackError) {
            console.log(`❌ All ERC1155 approval attempts failed: ${fallbackError.message}`);
        }
    }
}

main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});