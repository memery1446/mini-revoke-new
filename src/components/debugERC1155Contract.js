// import { ethers } from "ethers"
import { JsonRpcProvider } from "ethers";
import getProvider from "../utils/provider"
import { ERC1155_ABI, CONTRACT_ADDRESSES } from "../constants/abis"

const provider = getProvider()
const erc1155Contract = new ethers.Contract(CONTRACT_ADDRESSES.ERC1155, ERC1155_ABI, provider)

async function debugERC1155Contract() {
  console.log("Debugging ERC-1155 Contract")
  console.log("Contract Address:", CONTRACT_ADDRESSES.ERC1155)
  console.log("ABI Methods:", ERC1155_ABI.map((item) => item.name || item.type).filter(Boolean))

  try {
    // Check if the contract has the isApprovedForAll function
    const hasIsApprovedForAll = ERC1155_ABI.some((item) => item.name === "isApprovedForAll")
    console.log("Has isApprovedForAll in ABI:", hasIsApprovedForAll)

    // Try to call a different method, like balanceOf
    const ownerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Example address
    const tokenId = 1 // Example token ID
    const balance = await erc1155Contract.balanceOf(ownerAddress, tokenId)
    console.log("Balance of token 1:", balance.toString())

    // Now try isApprovedForAll
    const spenderAddress = CONTRACT_ADDRESSES.MockSpender
    const isApproved = await erc1155Contract.isApprovedForAll(ownerAddress, spenderAddress)
    console.log("Is Approved For All:", isApproved)
  } catch (error) {
    console.error("Error in debug function:", error)
  }
}

debugERC1155Contract()

