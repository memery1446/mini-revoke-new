const hre = require("hardhat");
const { ethers } = require("hardhat"); // Import ethers explicitly

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0]; 
  console.log(`📌 Approving tokens as: ${deployer.address}`);

  // 🔹 Manually assign deployed contract addresses
  const tokenAddresses = {
    tk1: "0xa85EffB2658CFd81e0B1AaD4f2364CdBCd89F3a1",
    tk2: "0x8aAC5570d54306Bb395bf2385ad327b7b706016b",
    permitToken: "0x64f5219563e28EeBAAd91Ca8D31fa3b36621FD4f",
    feeToken: "0x1757a98c1333B9dc8D408b194B2279b5AFDF70Cc",
    testNFT: "0x6484EB0792c646A4827638Fc1B6F20461418eB00",
    upgradeableNFT: "0xf201fFeA8447AB3d43c98Da3349e0749813C9009",
    dynamicNFT: "0xA75E74a5109Ed8221070142D15cEBfFe9642F489",
    testERC1155: "0x26291175Fa0Ea3C8583fEdEB56805eA68289b105",
    upgradeableERC1155: "0x840748F7Fd3EA956E5f4c88001da5CC1ABCBc038",
    mockSpender: "0x1bEfE2d8417e22Da2E0432560ef9B2aB68Ab75Ad"
  };

  const spender = tokenAddresses.mockSpender;

  // ✅ Load deployed contracts using correct provider syntax
  const tk1 = await ethers.getContractAt("TestToken", tokenAddresses.tk1, deployer);
  const tk2 = await ethers.getContractAt("TestToken", tokenAddresses.tk2, deployer);
  const permitToken = await ethers.getContractAt("PermitToken", tokenAddresses.permitToken, deployer);
  const feeToken = await ethers.getContractAt("FeeToken", tokenAddresses.feeToken, deployer);

  const testNFT = await ethers.getContractAt("TestNFT", tokenAddresses.testNFT, deployer);
  const upgradeableNFT = await ethers.getContractAt("UpgradeableNFT", tokenAddresses.upgradeableNFT, deployer);
  const dynamicNFT = await ethers.getContractAt("DynamicNFT", tokenAddresses.dynamicNFT, deployer);

  const testERC1155 = await ethers.getContractAt("TestERC1155", tokenAddresses.testERC1155, deployer);
  const upgradeableERC1155 = await ethers.getContractAt("UpgradeableERC1155", tokenAddresses.upgradeableERC1155, deployer);

  // ✅ Fix `parseUnits` by explicitly referencing `ethers.utils`
  const amount = ethers.utils ? ethers.utils.parseUnits("1000", 18) : ethers.parseUnits("1000", 18);

  // ✅ Approve ERC-20 tokens
  await tk1.approve(spender, amount);
  await tk2.approve(spender, amount);
  await permitToken.approve(spender, amount);
  await feeToken.approve(spender, amount);
  console.log("✅ Approved ERC-20 tokens");

  // ✅ Approve ERC-721 NFTs
  await testNFT.setApprovalForAll(spender, true);
  await upgradeableNFT.setApprovalForAll(spender, true);
  await dynamicNFT.setApprovalForAll(spender, true);
  console.log("✅ Approved ERC-721 NFTs");

  // ✅ Approve ERC-1155 tokens
  await testERC1155.setApprovalForAll(spender, true);
  await upgradeableERC1155.setApprovalForAll(spender, true);
  console.log("✅ Approved ERC-1155 tokens");

  console.log("🎉 Approval successful!");
}

main().catch((error) => {
  console.error("❌ Approval Error:", error);
  process.exit(1);
});
