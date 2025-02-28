"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setApprovals } from "../../store/approvalsSlice"
import { getProvider } from "../../utils/web3"
import { batchRevokeERC20Approvals, batchRevokeERC721Approvals, batchRevokeERC1155Approvals } from "../../utils/revoke"

function ApprovalDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedApprovals, setSelectedApprovals] = useState([])
  const [revokeResults, setRevokeResults] = useState(null)
  const approvals = useSelector((state) => state.approvals.approvals)
  const dispatch = useDispatch()

  const fetchApprovals = async () => {
    setIsLoading(true)
    try {
      const provider = await getProvider()
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Mock data for demonstration
      const mockApprovals = [
        {
          id: "1",
          type: "ERC-20",
          token: "USDT",
          tokenSymbol: "USDT",
          spender: "0xSpenderAddress1",
          allowance: "1000",
        },
        {
          id: "2",
          type: "ERC-721",
          token: "CryptoKitties",
          tokenSymbol: "CK",
          spender: "0xSpenderAddress2",
          tokenId: "123",
        },
        {
          id: "3",
          type: "ERC-1155",
          token: "Enjin",
          tokenSymbol: "ENJ",
          spender: "0xSpenderAddress3",
          tokenId: "456",
        },
      ]

      dispatch(setApprovals(mockApprovals))
    } catch (error) {
      console.error("Error fetching approvals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  // Keep all the imports and state management at the top

  // Add these functions after fetchApprovals
  const handleToggleSelect = (approval) => {
    setSelectedApprovals((prev) => {
      if (prev.some((a) => a.id === approval.id)) {
        return prev.filter((a) => a.id !== approval.id)
      } else {
        return [...prev, approval]
      }
    })
  }

  const handleRevokeApproval = async (approval) => {
    setRevokeResults(null)
    try {
      const provider = await getProvider()
      const signer = await provider.getSigner()

      let tx
      if (approval.type === "ERC-20") {
        tx = await batchRevokeERC20Approvals([approval], signer)
      } else if (approval.type === "ERC-721") {
        tx = await batchRevokeERC721Approvals([approval], signer)
      } else if (approval.type === "ERC-1155") {
        tx = await batchRevokeERC1155Approvals([approval], signer)
      }

      setRevokeResults({
        success: true,
        message: `Successfully revoked approval for ${approval.spender}`,
      })

      // Remove the approval from Redux state
      dispatch(setApprovals(approvals.filter((a) => a.id !== approval.id)))

      // Clear selection
      setSelectedApprovals((prev) => prev.filter((a) => a.id !== approval.id))

      // Refresh approvals after a short delay
      setTimeout(fetchApprovals, 2000)
    } catch (error) {
      console.error("Error revoking approval:", error)
      setRevokeResults({
        success: false,
        message: `Failed to revoke: ${error.message}`,
      })
    }
  }

  const handleBatchRevoke = async () => {
    if (selectedApprovals.length === 0) return

    setRevokeResults(null)
    try {
      const provider = await getProvider()
      const signer = await provider.getSigner()

      const erc20Approvals = selectedApprovals.filter((a) => a.type === "ERC-20")
      const erc721Approvals = selectedApprovals.filter((a) => a.type === "ERC-721")
      const erc1155Approvals = selectedApprovals.filter((a) => a.type === "ERC-1155")

      if (erc20Approvals.length > 0) {
        await batchRevokeERC20Approvals(erc20Approvals, signer)
      }

      if (erc721Approvals.length > 0) {
        await batchRevokeERC721Approvals(erc721Approvals, signer)
      }

      if (erc1155Approvals.length > 0) {
        await batchRevokeERC1155Approvals(erc1155Approvals, signer)
      }

      setRevokeResults({
        success: true,
        message: `Successfully revoked ${selectedApprovals.length} approvals`,
      })

      // Remove the approvals from Redux state
      const selectedIds = selectedApprovals.map((a) => a.id)
      dispatch(setApprovals(approvals.filter((a) => !selectedIds.includes(a.id))))

      // Clear selection
      setSelectedApprovals([])

      // Refresh approvals after a short delay
      setTimeout(fetchApprovals, 2000)
    } catch (error) {
      console.error("Error batch revoking:", error)
      setRevokeResults({
        success: false,
        message: `Failed to batch revoke: ${error.message}`,
      })
    }
  }

  // Replace the return statement with this complete UI
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Token Approvals</h3>
        <div>
          {selectedApprovals.length > 0 && (
            <button className="btn btn-danger me-2" onClick={handleBatchRevoke} disabled={isLoading}>
              Revoke Selected ({selectedApprovals.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchApprovals} disabled={isLoading}>
            {isLoading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>
      </div>
      <div className="card-body">
        {revokeResults && (
          <div className={`alert ${revokeResults.success ? "alert-success" : "alert-danger"} mb-3`}>
            {revokeResults.message}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Fetching your approvals...</p>
          </div>
        ) : approvals && approvals.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedApprovals([...approvals])
                        } else {
                          setSelectedApprovals([])
                        }
                      }}
                      checked={selectedApprovals.length === approvals.length && approvals.length > 0}
                    />
                  </th>
                  <th>Type</th>
                  <th>Token</th>
                  <th>Spender</th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedApprovals.some((a) => a.id === approval.id)}
                        onChange={() => handleToggleSelect(approval)}
                      />
                    </td>
                    <td>{approval.type}</td>
                    <td>
                      <div className="d-flex align-items-center">{approval.tokenSymbol || "Unknown"}</div>
                    </td>
                    <td>
                      <span className="text-monospace small">
                        {approval.spender.substring(0, 6)}...{approval.spender.substring(38)}
                      </span>
                    </td>
                    <td>
                      {approval.type === "ERC-20" && (
                        <span>
                          {approval.allowance === "Unlimited" ? (
                            <span className="badge bg-danger">Unlimited</span>
                          ) : (
                            <span>{approval.allowance}</span>
                          )}
                        </span>
                      )}
                      {approval.type === "ERC-721" && <span>Token ID: {approval.tokenId}</span>}
                      {approval.type === "ERC-1155" && <span>All Tokens</span>}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRevokeApproval(approval)}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="mb-0">No approvals found for this wallet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApprovalDashboard

