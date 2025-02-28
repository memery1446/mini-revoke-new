"use client"

import { useEffect, useState, useCallback, useRef } from "react";
import { Contract } from "ethers";
import { useSelector, useDispatch } from "react-redux";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { setApprovals, removeApproval } from "../store/web3Slice";
import { getProvider, getSigner } from "../utils/providerService";

const ExistingApprovals = ({ onToggleSelect }) => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals) || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(false);
  
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const fetchApprovals = useCallback(async () => {
    if (!account || revoking) return;
    try {
      setLoading(true);
      setError(null);
      console.log("📋 Fetching approvals for account:", account);
      
      const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2];
      console.log("📋 Token contracts:", tokenContracts);
      
      const erc20Fetched = await getERC20Approvals(tokenContracts, account) || [];
      const erc721Fetched = await getERC721Approvals(account) || [];
      const erc1155Fetched = await getERC1155Approvals(account) || [];
      
      if (!isMounted.current) return;
      
      const allApprovals = [...erc20Fetched, ...erc721Fetched, ...erc1155Fetched];
      console.log("🟢 All approvals fetched:", allApprovals);
      
      dispatch(setApprovals(allApprovals));
    } catch (err) {
      console.error("❌ Error fetching approvals:", err);
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [account, dispatch, revoking]);
  
  useEffect(() => {
    if (account) fetchApprovals();
  }, [account, fetchApprovals]);
  
  const revokeApproval = async (approval) => {
    if (revoking) return;
    try {
      setRevoking(true);
      console.log("🚨 Revoking approval:", approval);
      
      const signer = await getSigner();
      if (!signer) throw new Error("❌ Signer not available");
      
      const contract = new Contract(
        approval.contract,
        ["function setApprovalForAll(address operator, bool approved) external"],
        signer
      );
      
      const tx = await contract.setApprovalForAll(approval.spender, false);
      console.log("Transaction sent, awaiting confirmation...");
      await tx.wait();
      console.log("✅ Approval revoked successfully!");
      
      if (isMounted.current) {
        dispatch(removeApproval(approval));
        setTimeout(fetchApprovals, 2000);
      }
    } catch (err) {
      console.error("❌ Error revoking approval:", err);
      if (isMounted.current) setRevoking(false);
    }
  };
  
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Existing Approvals</h3>
        <button className="btn btn-secondary" onClick={fetchApprovals} disabled={loading || revoking}>
          {loading ? "Loading..." : "🔄 Refresh Approvals"}
        </button>
      </div>
      <div className="card-body">
        {loading ? <p>Loading approvals...</p> : error ? <p className="text-danger">{error}</p> : approvals.length === 0 ? <p>No active approvals found.</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Contract</th>
                <th>Spender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr key={approval.id}>
                  <td>
                    <input type="checkbox" onChange={() => onToggleSelect?.(approval)} />
                  </td>
                  <td>{approval.contract}</td>
                  <td>{approval.spender}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => revokeApproval(approval)} disabled={revoking}>
                      {revoking ? "Processing..." : "🚨 Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExistingApprovals;