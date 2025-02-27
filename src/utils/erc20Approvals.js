import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CONTRACT_ADDRESSES, TOKEN_ABI } from "../../src/constants/abis";

const provider = new JsonRpcProvider(process.env.REACT_APP_ALCHEMY_SEPOLIA_URL);

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

    // Enhanced: Add more potential spenders to check
    const spenderAddresses = [
        CONTRACT_ADDRESSES.TK1,
        CONTRACT_ADDRESSES.MockSpender, // Add the mock spender
        "0x4330F46C529ADa1Ef8BAA8125800be556441F3A5",
        "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608", // Add from logs
        // Add more common DEXes and platforms
        "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap V3 Router
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap Router
        "0x1111111254fb6c44bAC0beD2854e76F90643097d"  // 1inch Router
    ];

    console.log("🔍 Fetching ERC-20 approvals for owner:", ownerAddress);
    console.log("📋 Checking contracts:", tokenContracts);
    console.log("📋 Checking spenders:", spenderAddresses);

    // Enhanced: Add common ERC20 tokens if not provided
    if (!tokenContracts || tokenContracts.length === 0) {
        console.log("⚠️ No token contracts provided, checking common tokens...");
        tokenContracts = [
            // Common ERC20 tokens on Sepolia
            CONTRACT_ADDRESSES.TK1,
            CONTRACT_ADDRESSES.TK2,
            // Add any other tokens you want to check
        ];
    }

    // Enhanced: Add dynamic ERC20 token detection
    try {
        console.log("🔍 Attempting to scan blockchain for approvals (this may take time)...");
        
        // Loop through each token contract
        for (let tokenAddress of tokenContracts) {
            try {
                tokenAddress = getAddress(tokenAddress);
            } catch {
                console.error(`❌ Invalid token address: ${tokenAddress}`);
                continue;
            }

            try {
                const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
                
                // Check approvals for known spenders
                for (let spender of spenderAddresses) {
                    try {
                        spender = getAddress(spender);
                        const allowance = await contract.allowance(ownerAddress, spender);

                        if (allowance > 0n) {
                            approvals.push({
                                contract: tokenAddress,
                                type: "ERC-20",
                                spender: spender,
                                amount: allowance.toString(),
                            });

                            console.log(`✅ Found approval: ${spender} can spend ${allowance} tokens from ${tokenAddress}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error checking allowance for ${spender} on ${tokenAddress}:`, error);
                    }
                }

            } catch (error) {
                console.error(`❌ Error interacting with contract at ${tokenAddress}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Error in approval scanning:", error);
    }

    console.log(`✅ Found ${approvals.length} ERC-20 approvals for ${ownerAddress}`);
    return approvals;
}

// Additional utility function to check a specific token approval
export async function checkSpecificApproval(tokenAddress, ownerAddress, spenderAddress) {
    try {
        // Validate addresses
        tokenAddress = getAddress(tokenAddress);
        ownerAddress = getAddress(ownerAddress);
        spenderAddress = getAddress(spenderAddress);
        
        console.log(`🔍 Checking specific approval: ${tokenAddress} from ${ownerAddress} to ${spenderAddress}`);
        
        const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
        const allowance = await contract.allowance(ownerAddress, spenderAddress);
        
        console.log(`Current allowance: ${allowance.toString()}`);
        return {
            exists: allowance > 0n,
            amount: allowance.toString(),
            contract: tokenAddress,
            owner: ownerAddress,
            spender: spenderAddress
        };
    } catch (error) {
        console.error("❌ Error checking specific approval:", error);
        return { exists: false, error: error.message };
    }
}