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

    try {
        // Validate owner address
        ownerAddress = getAddress(ownerAddress); 
    } catch {
        console.error(`❌ Invalid owner address: ${ownerAddress}`);
        return [];
    }

    // Define all spenders to check - including 0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608
    const spenderAddresses = [
        CONTRACT_ADDRESSES.TK1,
        CONTRACT_ADDRESSES.MockSpender,
        "0x4330F46C529ADa1Ef8BAA8125800be556441F3A5",
        "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608", // The spender we found approval for
        "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap V3 Router
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap Router
        "0x1111111254fb6c44bAC0beD2854e76F90643097d"  // 1inch Router
    ];

    console.log("🔍 Checking against spenders:", spenderAddresses);

    for (let tokenAddress of tokenContracts) {
        try {
            tokenAddress = getAddress(tokenAddress);
            console.log(`🔍 Checking token: ${tokenAddress}`);
        } catch {
            console.error(`❌ Invalid token address: ${tokenAddress}`);
            continue;
        }

        try {
            const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
            
            for (let spender of spenderAddresses) {
                try {
                    spender = getAddress(spender);
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
                        console.log(`✅ Found approval:`, approval);
                    } else {
                        console.log(`ℹ️ No approval for spender ${spender}`);
                    }
                } catch (error) {
                    console.error(`❌ Error fetching allowance for ${spender} on ${tokenAddress}:`, error);
                }
            }
        } catch (error) {
            console.error(`❌ Error interacting with contract at ${tokenAddress}:`, error);
        }
    }

    console.log(`✅ Completed ERC-20 check. Found ${approvals.length} approvals:`, approvals);
    return approvals;
}

// Export the original function to maintain compatibility
export default getERC20Approvals;

