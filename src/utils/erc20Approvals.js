import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CONTRACT_ADDRESSES, TOKEN_ABI } from "../../src/constants/abis"; // Keep your existing import path

const provider = new JsonRpcProvider(process.env.REACT_APP_ALCHEMY_SEPOLIA_URL);

/**
 * Fetch ERC-20 approvals for given token contracts and an owner address.
 * @param {Array<string>} tokenContracts - List of ERC-20 contract addresses.
 * @param {string} ownerAddress - Address of the token owner.
 * @returns {Promise<Array>} - Resolves to an array of approval objects.
 */
export async function getERC20Approvals(tokenContracts, ownerAddress) {
  console.log("🔍 Starting ERC-20 approval check for:", ownerAddress);
  console.log("🔍 Checking token contracts:", tokenContracts);
  
  let approvals = [];

  for (let tokenAddress of tokenContracts) {
    try {
      console.log(`🔍 Checking ERC-20 token: ${tokenAddress}`);
      const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
      
      for (let spender of spenderAddresses) {
        console.log(`🔍 Checking allowance for spender: ${spender}`);
        const allowance = await contract.allowance(ownerAddress, spender);
        console.log(`Allowance result: ${allowance.toString()}`);

        if (allowance > 0n) { // Using BigInt comparison
          const approval = {
            contract: tokenAddress,
            type: "ERC-20",
            spender: spender,
            amount: allowance.toString(),
          };
          
          approvals.push(approval);
          console.log(`✅ Found ERC-20 approval:`, approval);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking ERC-20 token ${tokenAddress}:`, error);
    }
  }

  console.log(`✅ Completed ERC-20 check. Found ${approvals.length} approvals:`, approvals);
  return approvals;
}

// Export the original function to maintain compatibility
export default getERC20Approvals;

