"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Contract } from "ethers";
import { useSelector, useDispatch } from "react-redux";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider, getSigner } from "../utils/providerService";

const ExistingApprovals = ({ onToggleSelect }) => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals) || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApprovals = useCallback(async () => {
    if (!account) return;
    try {
      setLoading(true);
      setError(null);
      console.log("📋 Fetching approvals for account:", account);

      const erc20Fetched = await getERC20Approvals([], account) || [];
      const erc721Fetched = await getERC721Approvals(account) || [];
      const erc1155Fetched = await getERC1155Approvals(account) || [];

      console.log("🟢 Approvals BEFORE Redux update:", [...erc20Fetched, ...erc721Fetched, ...erc1155Fetched]);

      // Temporarily remove filtering
      const uniqueApprovals = [...erc20Fetched, ...erc721Fetched, ...erc1155Fetched];

      console.log("🟢 Approvals AFTER Processing:", uniqueApprovals);
      dispatch(setApprovals(uniqueApprovals));
    } catch (err) {
      console.error("❌ Error fetching approvals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [account, dispatch]);

  useEffect(() => {
    console.log("🔄 useEffect triggered for fetching approvals...");
    if (account) fetchApprovals();
  }, [account, fetchApprovals]);

  useEffect(() => {
    console.log("🔄 ExistingApprovals component re-rendering, approvals:", approvals);
  }, [approvals]);

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Existing Approvals</h3>
        <button className="btn btn-secondary" onClick={fetchApprovals} disabled={loading}>
          {loading ? "Loading..." : "🔄 Refresh Approvals"}
        </button>
      </div>
      <div className="card-body">
        {loading ? <p>Loading approvals...</p> : error ? <p className="text-danger">{error}</p> : approvals.length === 0 ? (
          <p className="text-warning">No active approvals found.</p>
        ) : (
          <ul>
            {approvals.map((approval, index) => (
              <li key={index}>
                {approval.type} - {approval.contract} → {approval.spender}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExistingApprovals;


