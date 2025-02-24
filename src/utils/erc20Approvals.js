import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CONTRACT_ADDRESSES, TOKEN_ABI } from "../../src/constants/abis"; // ✅ Ensuring proper import

const provider = new JsonRpcProvider("http://127.0.0.1:8545");

/**
 * Fetch ERC-20 approvals for given token contracts and an owner address.
 * @param {Array<string>} tokenContracts - List of ERC-20 contract addresses.
 * @param {string} ownerAddress - Address of the token owner.
 * @returns {Promise<Array>} - Resolves to an array of approval objects.
 */
export async function getERC20Approvals(tokenContracts, ownerAddress) {
    let approvals = [];

    try {
        // ✅ Validate owner address
        ownerAddress = getAddress(ownerAddress); 
    } catch {
        console.error(`❌ Invalid owner address: ${ownerAddress}`);
        return [];
    }

    const spenderAddresses = [
        CONTRACT_ADDRESSES.TK1, // ✅ Token contract itself
        "0x4330f46c529ada1ef8baa8125800be556441f3a5" // ✅ Test wallet
    ];

    console.log("🔍 Fetching ERC-20 approvals for owner:", ownerAddress);

    for (let tokenAddress of tokenContracts) {
        try {
            tokenAddress = getAddress(tokenAddress);
        } catch {
            console.error(`❌ Invalid token address: ${tokenAddress}`);
            continue;
        }

        try {
            const contract = new Contract(tokenAddress, TOKEN_ABI, provider);

            for (let spender of spenderAddresses) {
                try {
                    spender = getAddress(spender); // ✅ Validate spender address
                    const allowance = await contract.allowance(ownerAddress, spender);

                    if (allowance > 0n) { // ✅ BigInt handling
                        approvals.push({
                            contract: tokenAddress,
                            type: "ERC-20",
                            spender: spender,
                            amount: allowance.toString(),
                        });

                        console.log(`✅ Approved: ${spender} can spend ${allowance} tokens from ${tokenAddress}`);
                    }
                } catch (error) {
                    console.error(`❌ Error fetching allowance for ${spender} on ${tokenAddress}:`, error);
                }
            }
        } catch (error) {
            console.error(`❌ Error interacting with contract at ${tokenAddress}:`, error);
        }
    }

    return approvals;
}
