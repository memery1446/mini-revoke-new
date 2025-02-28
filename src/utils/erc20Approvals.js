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
    
    let approvalsMap = new Map();

    // ... (rest of the existing code)

    for (let tokenAddress of tokenContracts) {
        // ... (existing validation code)

        try {
            const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
            
            for (let spender of spenderAddresses) {
                // ... (existing validation code)

                const allowance = await contract.allowance(ownerAddress, spender);
                console.log(`Allowance result: ${allowance.toString()}`);

                if (allowance > 0n) { // Using BigInt comparison
                    const approvalKey = `${tokenAddress}-${spender}`;
                    const approval = {
                        contract: tokenAddress,
                        type: "ERC-20",
                        spender: spender,
                        amount: allowance.toString(),
                    };
                    
                    approvalsMap.set(approvalKey, approval);
                    console.log(`✅ Found approval:`, approval);
                } else {
                    console.log(`ℹ️ No approval for spender ${spender}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error interacting with contract at ${tokenAddress}:`, error);
        }
    }

    const uniqueApprovals = Array.from(approvalsMap.values());
    console.log(`✅ Completed ERC-20 check. Found ${uniqueApprovals.length} unique approvals:`, uniqueApprovals);
    return uniqueApprovals;
}

// Export the original function to maintain compatibility
export default getERC20Approvals;

