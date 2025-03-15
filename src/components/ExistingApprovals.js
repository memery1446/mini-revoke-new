"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/providerService";

const ExistingApprovals = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const network = useSelector((state) => state.web3.network);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApprovals = useCallback(async () => {
    console.log("🟠 fetchApprovals() function started...");
    
    if (!account || !network) {
      console.error("❌ No account or network detected, skipping approval fetch.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("📋 Fetching approvals for account:", account, "on network:", network);

      let provider = window.ethersProvider;
      if (!provider) {
        console.log("⚠️ Provider not found, initializing...");
        provider = await getProvider();
      }

      if (!provider) {
        console.error("❌ Provider still unavailable, approvals cannot be fetched.");
        return;
      }

      console.log("✅ Provider ready, proceeding with approval fetching...");

      const erc20Fetched = await getERC20Approvals([], account, provider) || [];
      console.log("🔍 ERC-20 Approvals:", erc20Fetched);

      const erc721Fetched = await getERC721Approvals(account, provider) || [];
      console.log("🔍 ERC-721 Approvals:", erc721Fetched);

      const erc1155Fetched = await getERC1155Approvals(account, provider) || [];
      console.log("🔍 ERC-1155 Approvals:", erc1155Fetched);

      const allApprovals = [...erc20Fetched, ...erc721Fetched, ...erc1155Fetched];

      if (allApprovals.length === 0) {
        console.warn("⚠️ No approvals were fetched. Possible provider or contract issue.");
      }

      console.log("🟢 Approvals BEFORE Redux update:", allApprovals);
      dispatch(setApprovals(allApprovals));
      console.log("🔵 Approvals AFTER Redux update:", allApprovals);
    } catch (err) {
      console.error("❌ Error fetching approvals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [account, network, dispatch]);

  useEffect(() => {
    console.log("🔄 useEffect triggered for fetching approvals...");
    if (account && network) {
      console.log("✅ Calling fetchApprovals()...");
      fetchApprovals();
    } else {
      console.log("⚠️ Account or network not available, skipping fetch.");
    }
  }, [account, network]);

  // 🔴 MANUALLY FORCE fetchApprovals() TO RUN ON LOAD
  useEffect(() => {
    setTimeout(() => {
      console.log("⏳ Manually triggering fetchApprovals() after delay...");
      fetchApprovals();
    }, 5000); // Delayed execution to ensure all state is set
  }, []);

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h3 className="mb-0">Existing Approvals</h3>
        <button className="btn btn-secondary" onClick={fetchApprovals} disabled={loading}>
          {loading ? "Loading..." : "🔄 Refresh Approvals"}
        </button>
      </div>
      <div className="card-body">
        {loading ? (
          <p>Loading approvals...</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <p className="text-warning">No active approvals found.</p>
        )}
      </div>
    </div>
  );
};

export default ExistingApprovals;
