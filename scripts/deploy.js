const hre = require("hardhat");
const { ethers } = require("hardhat"); // Explicitly import ethers

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0]; // Use the first signer
  console.log(`📌 Deploying contracts as: ${deployer.address}`);

  // 🔹 Fetch gas price (avoids EIP-1559 issues)
  const provider = ethers.provider; // Hardhat provider
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.utils.parseUnits("10", "gwei"); // Use a default if undefined

  console.log(`📌 Gas Price: ${gasPrice.toString()} wei`);

  // ✅ Deploy ERC-20 Test Tokens
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const tk1 = await TestToken.deploy("Test Token 1", "TK1", 18, { gasPrice });
  await tk1.waitForDeployment();
  console.log(`✅ TK1 deployed at: ${await tk1.getAddress()}`);

  const tk2 = await TestToken.deploy("Test Token 2", "TK2", 18, { gasPrice });
  await tk2.waitForDeployment();
  console.log(`✅ TK2 deployed at: ${await tk2.getAddress()}`);

  const PermitToken = await hre.ethers.getContractFactory("PermitToken");
  const permitToken = await PermitToken.deploy("Permit Token", "PTK", 18, { gasPrice });
  await permitToken.waitForDeployment();
  console.log(`✅ PermitToken deployed at: ${await permitToken.getAddress()}`);

  const FeeToken = await hre.ethers.getContractFactory("FeeToken");
  const feeToken = await FeeToken.deploy("Fee Token", "FTK", 18, deployer.address, { gasPrice });
  await feeToken.waitForDeployment();
  console.log(`✅ FeeToken deployed at: ${await feeToken.getAddress()}`);

  // ✅ Deploy ERC-721 Contracts
  const TestNFT = await hre.ethers.getContractFactory("TestNFT");
  const testNFT = await TestNFT.deploy({ gasPrice });
  await testNFT.waitForDeployment();
  console.log(`✅ TestNFT deployed at: ${await testNFT.getAddress()}`);

  const UpgradeableNFT = await hre.ethers.getContractFactory("UpgradeableNFT");
  const upgradeableNFT = await UpgradeableNFT.deploy({ gasPrice });
  await upgradeableNFT.waitForDeployment();
  console.log(`✅ UpgradeableNFT deployed at: ${await upgradeableNFT.getAddress()}`);

  const DynamicNFT = await hre.ethers.getContractFactory("DynamicNFT");
  const dynamicNFT = await DynamicNFT.deploy({ gasPrice });
  await dynamicNFT.waitForDeployment();
  console.log(`✅ DynamicNFT deployed at: ${await dynamicNFT.getAddress()}`);

  // ✅ Deploy ERC-1155 Contracts
  const TestERC1155 = await hre.ethers.getContractFactory("TestERC1155");
  const testERC1155 = await TestERC1155.deploy(deployer.address, { gasPrice });
  await testERC1155.waitForDeployment();
  console.log(`✅ TestERC1155 deployed at: ${await testERC1155.getAddress()}`);

  const UpgradeableERC1155 = await hre.ethers.getContractFactory("UpgradeableERC1155");
  const upgradeableERC1155 = await UpgradeableERC1155.deploy({ gasPrice });
  await upgradeableERC1155.waitForDeployment();
  console.log(`✅ UpgradeableERC1155 deployed at: ${await upgradeableERC1155.getAddress()}`);

  // ✅ Deploy MockSpender
  console.log("🚀 Deploying MockSpender contract...");
  const MockSpender = await hre.ethers.getContractFactory("MockSpender");
  const mockSpender = await MockSpender.deploy({ gasPrice });
  await mockSpender.waitForDeployment();
  console.log(`✅ MockSpender deployed at: ${await mockSpender.getAddress()}`);

  console.log("🎉 Deployment successful!");
}

main().catch((error) => {
  console.error("❌ Deployment Error:", error);
  process.exit(1);
});
