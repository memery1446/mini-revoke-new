// const hre = require("hardhat");

// async function main() {
//   const [deployer] = await hre.ethers.getSigners();
//   console.log(`📌 Using account: ${deployer.address}`);
//   console.log(`📌 Network: ${hre.network.name}`);

//   // Dynamic gas pricing
//   const feeData = await hre.ethers.provider.getFeeData();
//   const maxFeePerGas = feeData.maxFeePerGas * BigInt(2);
//   const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * BigInt(2);

//   const gasOverrides = {
//     maxFeePerGas,
//     maxPriorityFeePerGas,
//   };

//   console.log(`📌 Gas settings: ${hre.ethers.formatUnits(maxFeePerGas, 'gwei')} gwei max fee`);

//   // Contract addresses
//   const addresses = {
//     // TK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a",
//     // TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF",
//     TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354",
//     ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A",
//     MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
//   };

//   // Connect to existing contracts
//   // const TestToken = await hre.ethers.getContractFactory("TestToken");
//   const TestNFT = await hre.ethers.getContractFactory("TestNFT");
//   const TestERC1155 = await hre.ethers.getContractFactory("TestERC1155");
  
//   // const tk1 = TestToken.attach(addresses.TK1);
//   // const tk2 = TestToken.attach(addresses.TK2);
//   const testNFT = TestNFT.attach(addresses.TestNFT);
//   const testERC1155 = TestERC1155.attach(addresses.ERC1155);
  
//   console.log("📌 Connected to existing contracts");

//   try {
//     console.log("🔄 Minting and setting up approvals...");
    
//     // Approve ERC-20 tokens (TK1 and TK2)
//     // const maxUint256 = hre.ethers.MaxUint256;
//     // const tx1 = await tk1.approve(addresses.MockSpender, maxUint256, gasOverrides);
//     // await tx1.wait();
//     // console.log(`✅ Approved TK1 for MockSpender - tx: ${tx1.hash}`);
    
//     // const tx2 = await tk2.approve(addresses.MockSpender, maxUint256, gasOverrides);
//     // await tx2.wait();
//     // console.log(`✅ Approved TK2 for MockSpender - tx: ${tx2.hash}`);
    
//     // Mint and Approve ERC-721 (NFT)
//     const mintTx = await testNFT.safeMint(deployer.address, gasOverrides);
//     const mintReceipt = await mintTx.wait();
//     const mintEvent = mintReceipt.logs.find(log => log.eventName === 'Transfer');
//     const tokenId = mintEvent.args[2]; // Assuming the token ID is the third argument in the Transfer event
//     console.log(`✅ Minted new NFT with ID ${tokenId} - tx: ${mintTx.hash}`);

//     const tx3 = await testNFT.approve(addresses.MockSpender, tokenId, gasOverrides);
//     await tx3.wait();
//     console.log(`✅ Approved TestNFT (token ID ${tokenId}) for MockSpender - tx: ${tx3.hash}`);
    
//     // Mint and Approve ERC-1155
//     const erc1155Id = 1; // You can change this ID if needed
//     const amount = 1;
//     const mintTx1155 = await testERC1155.mint(deployer.address, erc1155Id, amount, "0x", gasOverrides);
//     await mintTx1155.wait();
//     console.log(`✅ Minted ERC1155 token with ID ${erc1155Id} - tx: ${mintTx1155.hash}`);

//     const tx4 = await testERC1155.setApprovalForAll(addresses.MockSpender, true, gasOverrides);
//     await tx4.wait();
//     console.log(`✅ Approved ERC1155 for MockSpender - tx: ${tx4.hash}`);
    
//     console.log("🎉 All tokens minted and approvals set up successfully!");
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//     if (error.data) {
//       try {
//         const decodedError = testNFT.interface.parseError(error.data);
//         if (decodedError) {
//           console.error("Decoded error:", decodedError.name, decodedError.args);
//         }
//       } catch (parseError) {
//         console.error("Could not parse error data:", error.data);
//       }
//     }
//   }
// }

// main().catch((error) => {
//   console.error("❌ Error:", error);
//   process.exit(1);
// });

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
    TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354",
    ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A",
    MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
  };

  // Connect to existing contracts
  const TestNFT = await hre.ethers.getContractFactory("TestNFT");
  const TestERC1155 = await hre.ethers.getContractFactory("TestERC1155");
  
  const testNFT = TestNFT.attach(addresses.TestNFT);
  const testERC1155 = TestERC1155.attach(addresses.ERC1155);
  
  console.log("📌 Connected to existing contracts");

  try {
    console.log("🔄 Minting and setting up approvals...");
    
    // Mint and Approve ERC-721 (NFT)
    const mintTx = await testNFT.safeMint(deployer.address, gasOverrides);
    const mintReceipt = await mintTx.wait();
    const mintEvent = mintReceipt.logs.find(log => log.eventName === 'Transfer');
    const tokenId = mintEvent.args[2]; // Assuming the token ID is the third argument in the Transfer event
    console.log(`✅ Minted new NFT with ID ${tokenId} - tx: ${mintTx.hash}`);

    const tx3 = await testNFT.approve(addresses.MockSpender, tokenId, gasOverrides);
    await tx3.wait();
    console.log(`✅ Approved TestNFT (token ID ${tokenId}) for MockSpender - tx: ${tx3.hash}`);
    
    // Mint ERC-1155
    const erc1155Id = 3; // Using a new token ID
    const amount = 10; // Minting 10 tokens
    const mintTx1155 = await testERC1155.mint(deployer.address, erc1155Id, amount, gasOverrides);
    await mintTx1155.wait();
    console.log(`✅ Minted ${amount} ERC1155 tokens with ID ${erc1155Id} - tx: ${mintTx1155.hash}`);

    // Approve ERC-1155
    const tx4 = await testERC1155.setApprovalForAll(addresses.MockSpender, true, gasOverrides);
    await tx4.wait();
    console.log(`✅ Approved ERC1155 for MockSpender - tx: ${tx4.hash}`);
    
    console.log("🎉 All tokens minted and approvals set up successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      try {
        const decodedError = testNFT.interface.parseError(error.data);
        if (decodedError) {
          console.error("Decoded error:", decodedError.name, decodedError.args);
        }
      } catch (parseError) {
        console.error("Could not parse error data:", error.data);
      }
    }
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
