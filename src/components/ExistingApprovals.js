"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Contract } from "ethers"
import { useSelector, useDispatch } from "react-redux"
import { getERC20Approvals } from "../utils/erc20Approvals"
import { getERC721Approvals } from "../utils/nftApprovals"
import { getERC1155Approvals } from "../utils/erc1155Approvals"
import { CONTRACT_ADDRESSES } from "../constants/abis"
import { setApprovals, removeApproval } from "../store/web3Slice"
import { getProvider, getSigner } from "../utils/providerService"

const ExistingApprovals = ({ onToggleSelect }) => {
  const dispatch = useDispatch()
  const account = useSelector((state) => state.web3.account)
  const approvals = useSelector((state) => state.web3.approvals)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [revoking, setRevoking] = useState(false)
  
  // Use a ref to track if component is mounted
  const isMounted = useRef(true)
  
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch approvals function
  const fetchApprovals = useCallback(async () => {
    if (!account || revoking) return

    try {
      setLoading(true)
      setError(null)

      const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2]
      console.log("📋 Token contracts to check:", tokenContracts)
      console.log("📋 Account to check:", account)

      // Get all approvals
      console.log("🔄 Fetching ERC-20 approvals...")
      const erc20Fetched = await getERC20Approvals(tokenContracts, account)
      
      console.log("🔄 Fetching ERC-721 approvals...")
      const erc721Fetched = await getERC721Approvals(account)
      
      console.log("🔄 Fetching ERC-1155 approvals...")
      const erc1155Fetched = await getERC1155Approvals(account)
      
      if (!isMounted.current) return
      
      // Process and deduplicate approvals
      const erc20Approvals = Array.isArray(erc20Fetched) 
        ? erc20Fetched
            .filter(a => a && a.contract && a.spender)
            .map(a => ({
              ...a,
              type: "ERC-20",
              id: `erc20-${a.contract}-${a.spender}`
            })) 
        : [];
      
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
            .filter(a => a && a.contract)
            .map(a => ({
              ...a,
              type: "ERC-1155",
              id: `erc1155-${a.contract}-${a.spender || "unknown"}`
            })) 
        : [];
      
      // Combine and deduplicate
      const allApprovalsArray = [
        ...erc20Approvals,
        ...erc721Approvals,
        ...erc1155Approvals
      ];
      
      const uniqueApprovalsMap = new Map();
      allApprovalsArray.forEach(approval => {
        if (approval && approval.id) {
          uniqueApprovalsMap.set(approval.id, approval);
        }
      });
      
      const allApprovals = Array.from(uniqueApprovalsMap.values());
      console.log("🟢 All fetched approvals (deduplicated):", allApprovals);

      if (isMounted.current) {
        dispatch(setApprovals(allApprovals));
      }
    } catch (err) {
      console.error("❌ Error fetching approvals:", err)
      if (isMounted.current) {
        setError(err.message)
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [account, dispatch, revoking]);

  // Fetch approvals when account changes
  useEffect(() => {
    if (account) {
      fetchApprovals();
    }
  }, [account, fetchApprovals]);

  // Revoke approval function
  const revokeApproval = async (approval) => {
    if (revoking) return;
    
    try {
      setRevoking(true);
      console.log("🚨 Revoking approval:", JSON.stringify(approval));
      
      // Get signer from centralized service
      const signer = await getSigner();
      if (!signer) {
        console.error("❌ Signer not available");
        if (isMounted.current) {
          setRevoking(false);
        }
        return;
      }
      
      const isERC1155 = approval.type === "ERC-1155";
      const isERC721 = approval.type === "ERC-721";

      let tx;
      if (isERC1155) {
        const erc1155Contract = new Contract(
          approval.contract,
          [
            "function setApprovalForAll(address operator, bool approved) external",
            "function isApprovedForAll(address account, address operator) external view returns (bool)"
          ],
          signer
        );
        tx = await erc1155Contract.setApprovalForAll(approval.spender, false);
      } else if (isERC721) {
        const erc721Contract = new Contract(
          approval.contract,
          [
            "function setApprovalForAll(address operator, bool approved) external",
            "function isApprovedForAll(address owner, address operator) external view returns (bool)"
          ],
          signer
        );
        tx = await erc721Contract.setApprovalForAll(approval.spender, false);
      } else {
        // For ERC20
        const tokenContract = new Contract(
          approval.contract,
          ["function approve(address spender, uint256 amount) external returns (bool)"],
          signer
        );
        
        console.log(`Revoking ERC20 approval for ${approval.spender} on contract ${approval.contract}`);
        tx = await tokenContract.approve(approval.spender, 0);
      }

      console.log("Transaction sent, waiting for confirmation...");
      await tx.wait();
      console.log("✅ Approval successfully revoked!");
      
      if (isMounted.current) {
        // Update Redux first
        dispatch(removeApproval(approval));
        
        // Wait before refreshing all approvals
        setTimeout(() => {
          if (isMounted.current) {
            setRevoking(false);
            fetchApprovals();
          }
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Error revoking approval:", err);
      if (isMounted.current) {
        setRevoking(false);
        if (err.code !== 'ACTION_REJECTED') {
          alert(`Error: ${err.message}`);
        }
      }
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Existing Approvals</h3>
        <button 
          className="btn btn-secondary" 
          onClick={fetchApprovals} 
          disabled={loading || revoking}
        >
          {loading ? "Loading..." : "🔄 Refresh Approvals"}
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
                        onClick={() => revokeApproval(approval)}
                        disabled={revoking}
                      >
                        {revoking ? "Processing..." : "🚨 Revoke"}
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
        <button 
          className="btn btn-outline-secondary" 
          onClick={fetchApprovals} 
          disabled={loading || revoking}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default ExistingApprovals;

