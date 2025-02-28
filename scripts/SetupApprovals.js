const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📌 Using account: ${deployer.address}`);
  console.log(`📌 Network: ${hre.network.name}`);

  // Dynamic gas pricing
  const feeData = await hre.ethers.provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas * BigInt(2);
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * BigInt(2);

  const gasOverrides = {
    maxFeePerGas,
    maxPriorityFeePerGas,
  };

  console.log(`📌 Gas settings: ${hre.ethers.formatUnits(maxFeePerGas, 'gwei')} gwei max fee`);

  // Contract addresses
  const addresses = {
  //  TK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a",
  //  TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF",
    TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354",
    ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A",
    MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
  };

  // Connect to existing contracts
//  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const TestNFT = await hre.ethers.getContractFactory("TestNFT");
  const TestERC1155 = await hre.ethers.getContractFactory("TestERC1155");
  
 // const tk1 = TestToken.attach(addresses.TK1);
 // const tk2 = TestToken.attach(addresses.TK2);
  const testNFT = TestNFT.attach(addresses.TestNFT);
  const testERC1155 = TestERC1155.attach(addresses.ERC1155);
  
  console.log("📌 Connected to existing contracts");

  try {
    console.log("🔄 Setting up approvals...");
    
    // Approve ERC-20 tokens (TK1 and TK2)
    // const maxUint256 = hre.ethers.MaxUint256;
    // const tx1 = await tk1.approve(addresses.MockSpender, maxUint256, gasOverrides);
    // await tx1.wait();
    // console.log(`✅ Approved TK1 for MockSpender - tx: ${tx1.hash}`);
    
    // const tx2 = await tk2.approve(addresses.MockSpender, maxUint256, gasOverrides);
    // await tx2.wait();
    // console.log(`✅ Approved TK2 for MockSpender - tx: ${tx2.hash}`);
    
    // Check NFT ownership before approval
    const nftOwner = await testNFT.ownerOf(1);
    if (nftOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log(`⚠️ Warning: Your account does not own NFT with ID 1. Current owner: ${nftOwner}`);
    } else {
      // Approve ERC-721 (NFT)
      const tx3 = await testNFT.approve(addresses.MockSpender, 1, gasOverrides);
      await tx3.wait();
      console.log(`✅ Approved TestNFT (token ID 1) for MockSpender - tx: ${tx3.hash}`);
    }
    
    // Approve ERC-1155
    const tx4 = await testERC1155.setApprovalForAll(addresses.MockSpender, true, gasOverrides);
    await tx4.wait();
    console.log(`✅ Approved ERC1155 for MockSpender - tx: ${tx4.hash}`);
    
    console.log("🎉 All approvals set up successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    // If it's a contract error, try to decode it
    if (error.data) {
      const decodedError = testNFT.interface.parseError(error.data);
      if (decodedError) {
        console.error("Decoded error:", decodedError.name, decodedError.args);
      }
    }
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
