const hre = require("hardhat");

async function main() {
  const [deployer, account1] = await hre.ethers.getSigners();

  console.log(`🚀 Deploying Test Tokens with: ${deployer.address}`);
  console.log(`Deploying TestNFT with: ${deployer.address}`);
  console.log(`🚀 Deploying TestERC1155 with: ${deployer.address}`);

  const gasOverrides = {
    maxFeePerGas: hre.ethers.parseUnits("25", "gwei"),  // Avoids low gas issues
    maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),
  };

  // Deploy Two ERC-20 Test Tokens
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const tk1 = await TestToken.deploy("Test Token 1", "TK1", 18, gasOverrides);
  await tk1.waitForDeployment();
  console.log(`TK1 deployed at: ${await tk1.getAddress()}`);

  const tk2 = await TestToken.deploy("Test Token 2", "TK2", 18, gasOverrides);
  await tk2.waitForDeployment();
  console.log(`TK2 deployed at: ${await tk2.getAddress()}`);

  // Deploy ERC-721 TestNFT
  const TestNFT = await hre.ethers.getContractFactory("TestNFT");
  const testNFT = await TestNFT.deploy(gasOverrides);
  await testNFT.waitForDeployment();
  console.log(`TestNFT deployed at: ${await testNFT.getAddress()}`);

  // Deploy ERC-1155 Contract
  const TestERC1155 = await hre.ethers.getContractFactory("TestERC1155");
  const testERC1155 = await TestERC1155.deploy(deployer.address, gasOverrides);
  await testERC1155.waitForDeployment();
  console.log(`TestERC1155 deployed at: ${await testERC1155.getAddress()}`);

  // Mint tokens to the deployer BEFORE any transfers
  await tk1.mint(deployer.address, hre.ethers.parseUnits("5000", 18), gasOverrides);
  await tk2.mint(deployer.address, hre.ethers.parseUnits("5000", 18), gasOverrides);
  console.log(`Minted 5000 TK1 and TK2 to Deployer: ${deployer.address}`);

  // Mint NFTs to the deployer
  await testNFT.safeMint(deployer.address, gasOverrides);
  await testNFT.safeMint(deployer.address, gasOverrides);
  await testNFT.safeMint(deployer.address, gasOverrides);
  console.log(`Minted 3 NFTs to Deployer: ${deployer.address}`);

  // Mint ERC1155 tokens to the deployer
  await testERC1155.mint(deployer.address, 1, 100, gasOverrides);
  console.log(`Minted 100 ERC1155 tokens (ID 1) to Deployer: ${deployer.address}`);

  // Now transfer tokens to other accounts
  await tk1.transfer(account1.address, hre.ethers.parseUnits("1000", 18), gasOverrides);
  await tk2.transfer(account1.address, hre.ethers.parseUnits("1000", 18), gasOverrides);
  console.log(`Sent 1000 TK1 and TK2 to ${account1.address}`);

  // Transfer an NFT to account1 (use a valid token ID, e.g., 1)
  await testNFT.transferFrom(deployer.address, account1.address, 1, gasOverrides);
  console.log(`Transferred NFT (ID 1) to ${account1.address}`);

  // Transfer ERC1155 tokens to account1
  await testERC1155.safeTransferFrom(deployer.address, account1.address, 1, 50, "0x", gasOverrides);
  console.log(`Transferred 50 ERC1155 tokens (ID 1) to ${account1.address}`);

  console.log("✅ Deployment successful!");
}

// Run the deployment script and handle errors
main().catch((error) => {
  console.error("❌ Deployment Error:", error);
  process.exit(1);
});

