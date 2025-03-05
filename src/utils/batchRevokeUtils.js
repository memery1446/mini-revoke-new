// batchRevokeUtils.js
import { Contract, getAddress, ZeroAddress } from "ethers";
import { TOKEN_ABI, NFT_ABI, ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis";
import { getProvider } from "../utils/provider";

/**
 * Normalize Ethereum address with error handling.
 */
function safeGetAddress(address) {
  try {
    return getAddress(address);
  } catch (error) {
    console.error(`Invalid Ethereum address: ${address}`);
    return address;
  }
}

/**
 * 🔹 Revoke ERC-20 approvals (single or batch)
 * @param {Array<Object>} approvals - List of { contract, spender }
 * @param {ethers.Signer} signer - Wallet signer
 */
export async function revokeERC20Approvals(approvals, signer) {
  if (!approvals || approvals.length === 0) throw new Error("No ERC-20 approvals selected.");
  if (!signer) throw new Error("No signer provided.");

  console.log("🔄 Revoking ERC-20 approvals:", approvals);

  const txPromises = approvals.map(async (approval) => {
    const contract = new Contract(safeGetAddress(approval.contract), TOKEN_ABI, signer);
    return contract.approve(safeGetAddress(approval.spender), 0);
  });

  try {
    await Promise.all(txPromises.map(tx => tx.then(tx => tx.wait())));
    console.log("✅ ERC-20 Revocation successful!");
    return { success: true, count: approvals.length };
  } catch (error) {
    console.error("❌ ERC-20 Revocation Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 🔹 Revoke ERC-721 approvals (single or batch)
 * @param {Array<Object>} approvals - List of { contract, spender, tokenId }
 * @param {ethers.Signer} signer - Wallet signer
 */
export async function revokeERC721Approvals(approvals, signer) {
  if (!approvals || approvals.length === 0) throw new Error("No ERC-721 approvals selected.");
  if (!signer) throw new Error("No signer provided.");

  console.log("🔄 Revoking ERC-721 approvals:", approvals);

  const txPromises = approvals.map(async (approval) => {
    const contract = new Contract(safeGetAddress(approval.contract), NFT_ABI, signer);
    if (approval.tokenId === "all") {
      return contract.setApprovalForAll(safeGetAddress(approval.spender), false);
    } else {
      return contract.approve(ZeroAddress, parseInt(approval.tokenId, 10));
    }
  });

  try {
    await Promise.all(txPromises.map(tx => tx.then(tx => tx.wait())));
    console.log("✅ ERC-721 Revocation successful!");
    return { success: true, count: approvals.length };
  } catch (error) {
    console.error("❌ ERC-721 Revocation Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 🔹 Revoke ERC-1155 approvals (single or batch)
 * @param {Array<Object>} approvals - List of { contract, spender }
 * @param {ethers.Signer} signer - Wallet signer
 */
export async function revokeERC1155Approvals(approvals, signer) {
  if (!approvals || approvals.length === 0) throw new Error("No ERC-1155 approvals selected.");
  if (!signer) throw new Error("No signer provided.");

  console.log("🔄 Revoking ERC-1155 approvals:", approvals);

  const txPromises = approvals.map(async (approval) => {
    const contract = new Contract(safeGetAddress(approval.contract), ERC1155_ABI, signer);
    return contract.setApprovalForAll(safeGetAddress(approval.spender), false);
  });

  try {
    await Promise.all(txPromises.map(tx => tx.then(tx => tx.wait())));
    console.log("✅ ERC-1155 Revocation successful!");
    return { success: true, count: approvals.length };
  } catch (error) {
    console.error("❌ ERC-1155 Revocation Error:", error);
    return { success: false, error: error.message };
  }
}
