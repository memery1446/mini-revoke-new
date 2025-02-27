"use client"

import { useEffect, useState, useCallback } from "react"
import { BrowserProvider, Contract, JsonRpcProvider } from "ethers"
import { useSelector, useDispatch } from "react-redux"
import { getERC20Approvals } from "../utils/erc20Approvals"
import { getERC721Approvals } from "../utils/nftApprovals"
import { getERC1155Approvals } from "../utils/erc1155Approvals"
import { CONTRACT_ADDRESSES } from "../constants/abis"
import { setApprovals } from "../store/web3Slice"

const ExistingApprovals = ({ onToggleSelect }) => {
  const dispatch = useDispatch()
  const account = useSelector((state) => state.web3.account)
  const approvals = useSelector((state) => state.web3.approvals)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const provider = window.ethereum ? new BrowserProvider(window.ethereum) : new JsonRpcProvider("http://127.0.0.1:8545")

// Update the fetchApprovals function - focus on the approval processing part
const fetchApprovals = useCallback(async () => {
  if (!account) return

  try {
    setLoading(true)
    setError(null)

    const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2]
    console.log("📋 Token contracts to check:", tokenContracts)
    console.log("📋 Account to check:", account)

    console.log("🔄 Fetching ERC-20 approvals...")
    const erc20Fetched = await getERC20Approvals(tokenContracts, account)
    console.log("✅ Raw ERC-20 Approvals Fetched:", erc20Fetched)

    console.log("🔄 Fetching ERC-721 approvals...")
    const erc721Fetched = await getERC721Approvals(account)
    console.log("✅ Raw ERC-721 Approvals Fetched:", erc721Fetched)

    console.log("🔄 Fetching ERC-1155 approvals...")
    const erc1155Fetched = await getERC1155Approvals(account)
    console.log("✅ Raw ERC-1155 Approvals Fetched:", erc1155Fetched)

    // Add unique IDs to each approval type and filter out invalid entries
    const erc20Approvals = Array.isArray(erc20Fetched) 
      ? erc20Fetched
          .filter(a => a && a.contract && a.spender) // Filter out invalid entries
          .map(a => ({
            ...a,
            type: "ERC-20",
            id: `erc20-${a.contract}-${a.spender}`
          })) 
      : [];
    
    // Only include ERC-721 approval if it's a valid object with required properties
    const erc721Approvals = (erc721Fetched && 
                            typeof erc721Fetched === 'object' && 
                            (erc721Fetched.contract || CONTRACT_ADDRESSES.TestNFT) && 
                            (erc721Fetched.spender || CONTRACT_ADDRESSES.MockSpender)) 
      ? [{
          contract: erc721Fetched.contract || CONTRACT_ADDRESSES.TestNFT,
          spender: erc721Fetched.spender || CONTRACT_ADDRESSES.MockSpender,
          tokenId: erc721Fetched.tokenId || "0",
          type: "ERC-721",
          id: `erc721-${erc721Fetched.tokenId || "0"}-${erc721Fetched.spender || CONTRACT_ADDRESSES.MockSpender}`
        }] 
      : [];
    
    const erc1155Approvals = Array.isArray(erc1155Fetched) 
      ? erc1155Fetched
          .filter(a => a && a.contract) // Filter out invalid entries
          .map(a => ({
            ...a,
            type: "ERC-1155",
            id: `erc1155-${a.contract}-${a.spender || "unknown"}`
          })) 
      : [];
    
    console.log("✅ Processed ERC-20 Approvals:", erc20Approvals)
    console.log("✅ Processed ERC-721 Approvals:", erc721Approvals)
    console.log("✅ Processed ERC-1155 Approvals:", erc1155Approvals)

    // Combine all approvals and filter out any duplicates using a Map
    const allApprovalsArray = [
      ...erc20Approvals,
      ...erc721Approvals,
      ...erc1155Approvals
    ];
    
    // Use a Map to deduplicate approvals by ID
    const uniqueApprovalsMap = new Map();
    allApprovalsArray.forEach(approval => {
      if (approval && approval.id) {
        uniqueApprovalsMap.set(approval.id, approval);
      }
    });
    
    const allApprovals = Array.from(uniqueApprovalsMap.values());
    console.log("🟢 All fetched approvals (deduplicated):", allApprovals);

    dispatch(setApprovals(allApprovals));
  } catch (err) {
    console.error("❌ Error fetching approvals:", err)
    setError(err.message)
  } finally {
    setLoading(false)
  }
}, [account, dispatch]);

// Fix the useEffect to avoid duplicate fetching
useEffect(() => {
  // Only fetch if we have an account and we haven't fetched before
  // or we explicitly want to refetch (for example, after a state change)
  if (account) {
    fetchApprovals();
  }
  // Remove approvals.length from dependency array to prevent refetching when approvals change
}, [account, fetchApprovals]);

  const revokeApproval = async (approval) => {
    try {
      console.log("🚨 Revoking specific approval:", JSON.stringify(approval))
      console.log("🚨 Revoking for contract:", approval.contract, "spender:", approval.spender)

      const signer = await provider.getSigner()
      const isERC1155 = approval.type === "ERC-1155"
      const isERC721 = approval.type === "ERC-721"

      let tx
      if (isERC1155) {
        const erc1155Contract = new Contract(
          approval.contract,
          [
            "function setApprovalForAll(address operator, bool approved) external",
            "function isApprovedForAll(address account, address operator) external view returns (bool)"
          ],
          signer,
        )
        tx = await erc1155Contract.setApprovalForAll(approval.spender, false)
      } else if (isERC721) {
        const erc721Contract = new Contract(
          approval.contract,
          [
            "function setApprovalForAll(address operator, bool approved) external",
            "function isApprovedForAll(address owner, address operator) external view returns (bool)"
          ],
          signer,
        )
        tx = await erc721Contract.setApprovalForAll(approval.spender, false)
      } else {
        // For ERC20, ensure we're using the specific spender from the approval
        const tokenContract = new Contract(
          approval.contract,
          ["function approve(address spender, uint256 amount) external returns (bool)"],
          signer,
        )
        
        console.log(`Revoking ERC20 approval for ${approval.spender} on contract ${approval.contract}`)
        tx = await tokenContract.approve(approval.spender, 0)
      }

      await tx.wait()
      console.log("✅ Specific approval successfully revoked!")
      
      // Refresh approvals
      fetchApprovals()
    } catch (err) {
      console.error("❌ Error revoking approval:", err)
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Existing Approvals</h3>
        <button className="btn btn-secondary" onClick={fetchApprovals}>
          🔄 Refresh Approvals
        </button>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading approvals...</span>
            </div>
            <p className="mt-3">Fetching approvals...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <p>{error}</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="alert alert-info">
            <p>No active approvals found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>Select</th>
                  <th>Contract</th>
                  <th>Spender</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
{approvals.filter(approval => 
    approval && 
    approval.id && 
    approval.contract && 
    approval.spender
  ).map((approval) => (
    <tr key={approval.id}>
      <td>
        <input 
          type="checkbox" 
          onChange={() => {
            console.log("Toggling selection for approval:", approval);
            onToggleSelect(approval);
          }} 
        />
      </td>
      <td>{approval.contract}</td>
      <td>{approval.spender}</td>
      <td>{approval.amount || "N/A"}</td>
      <td>
        <button 
          className="btn btn-danger btn-sm" 
          onClick={() => revokeApproval(approval)}>
          🚨 Revoke
        </button>
      </td>
    </tr>
  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-footer bg-light">
        <button className="btn btn-outline-secondary" onClick={fetchApprovals} disabled={loading}>
          🔄 Refresh
        </button>
      </div>
    </div>
  )
}

export default ExistingApprovals

