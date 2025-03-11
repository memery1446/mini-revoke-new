const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0]; // Use the first signer
  console.log(`📌 Deploying contracts as: ${deployer.address}`);

  const gasOverrides = {
    maxFeePerGas: hre.ethers.parseUnits("75", "gwei"), 
    maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),
  };

  console.log(`📌 Gas Fee: ${gasOverrides.maxFeePerGas.toString()} gwei`);

  // ✅ Deploy ERC-20 Test Tokens
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const tk1 = await TestToken.deploy("Test Token 1", "TK1", 18);
  await tk1.waitForDeployment();
  console.log(`✅ TK1 deployed at: ${await tk1.getAddress()}`);

  const tk2 = await TestToken.deploy("Test Token 2", "TK2", 18);
  await tk2.waitForDeployment();
  console.log(`✅ TK2 deployed at: ${await tk2.getAddress()}`);

  // ✅ Deploy ERC-721 TestNFT
  const TestNFT = await hre.ethers.getContractFactory("TestNFT");
  const testNFT = await TestNFT.deploy();
  await testNFT.waitForDeployment();
  console.log(`✅ TestNFT deployed at: ${await testNFT.getAddress()}`);

  // ✅ Deploy ERC-1155 Contract
  const TestERC1155 = await hre.ethers.getContractFactory("TestERC1155");
  const testERC1155 = await TestERC1155.deploy(deployer.address);
  await testERC1155.waitForDeployment();
  console.log(`✅ TestERC1155 deployed at: ${await testERC1155.getAddress()}`);

  // ✅ Mint tokens for testing
  await tk1.mint(deployer.address, hre.ethers.parseUnits("5000", 18));
  await tk2.mint(deployer.address, hre.ethers.parseUnits("5000", 18));
  console.log(`✅ Minted 5000 TK1 & TK2`);

  // ✅ Mint NFTs for testing
  await testNFT.safeMint(deployer.address);
  await testNFT.safeMint(deployer.address);
  await testNFT.safeMint(deployer.address);
  console.log(`✅ Minted 3 NFTs`);

  // ✅ Mint ERC-1155 tokens
  await testERC1155.mint(deployer.address, 1, 100);
  console.log(`✅ Minted 100 ERC1155 tokens`);

  console.log("🎉 Deployment successful!");
}

main().catch((error) => {
  console.error("❌ Deployment Error:", error);
  process.exit(1);
});
