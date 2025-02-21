import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, TOKEN_ABI } from "../../src/constants/abis"; // ✅ Ensuring proper import

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

/** Function to get ERC-20 Approvals */
export async function getERC20Approvals(tokenContracts, ownerAddress) {
    let approvals = [];

    // ✅ Ensure the ownerAddress is defined and valid
    if (!ownerAddress || !ethers.utils.isAddress(ownerAddress)) {
        console.error(`❌ Invalid owner address: ${ownerAddress}`);
        return [];
    }

    const spenderAddresses = [
        CONTRACT_ADDRESSES.TK1, // ✅ Token contract itself
        "0x43c5df0c482c88cef8005389f64c362ee720a5bc" // ✅ Test wallet
    ];

    try {
        console.log("🔍 Debug: Token Contracts Input:", tokenContracts);

        for (let tokenAddress of tokenContracts) {
            if (!ethers.utils.isAddress(tokenAddress)) {
                console.error(`❌ Invalid token address: ${tokenAddress}`);
                continue;
            }

            console.log("🔍 Fetching ABI Methods...");
            const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
            console.log("✅ Contract ABI Methods:", contract.interface.fragments.map(f => f.name));

            for (let spender of spenderAddresses) {
                console.log("🔍 Checking ERC-20 Allowance...");
                console.log("📌 Token Address:", tokenAddress);
                console.log("📌 Spender Address:", spender);
                console.log("📌 Owner Address:", ownerAddress);

                try {
                    const network = await provider.getNetwork();
                    console.log("✅ Connected to Network ID:", network.chainId);

                    const allowance = await contract.allowance(ownerAddress, spender);
                    if (allowance.gt(0)) {
                        approvals.push({
                            contract: tokenAddress,
                            type: "ERC-20",
                            spender: spender,
                            amount: allowance.toString(),
                        });
                    }
                } catch (error) {
                    console.error(`❌ Error fetching allowance for spender: ${spender} on token: ${tokenAddress}`, error);
                }
            }
        }
    } catch (error) {
        console.error("❌ Error in getERC20Approvals function:", error);
    }

    return approvals;
}


