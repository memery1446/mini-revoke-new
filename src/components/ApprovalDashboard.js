"use client";

import React, { useState, useEffect } from "react";
import { batchRevokeERC20Approvals } from "../components/BatchRevoke";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals";
import { batchRevokeERC1155Approvals } from "../utils/erc1155Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { useSelector } from "react-redux";
import { getProvider } from "../utils/provider";

const ApprovalDashboard = () => {
  const wallet = useSelector((state) => state.web3.account);
  const [approvals, setApprovals] = useState([]);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const contractAddresses = {
    erc721: CONTRACT_ADDRESSES.TestNFT,
    erc1155: CONTRACT_ADDRESSES.ERC1155
  };

  useEffect(() => {
    if (wallet) {
      fetchApprovals();
    }
  }, [wallet]);

const fetchApprovals = async () => {
    setIsLoading(true);
    console.log("🔄 Fetching approvals...");

    try {
        const provider = await getProvider();
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        console.log("🔍 Wallet Address:", userAddress);

        const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2];

        console.log("📡 Fetching ERC-20 approvals...");
        const erc20Approvals = (await getERC20Approvals(tokenContracts, userAddress)) || [];
        console.log("✅ ERC-20 Approvals Fetched (Before State Update):", erc20Approvals);

        setApprovals(erc20Approvals);
        console.log("🟢 Approvals state after update:", approvals); // This should NOT be empty

        // Force UI re-render
        setTimeout(() => {
            console.log("🔄 Refreshing UI...");
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error("❌ Error fetching approvals:", error);
        setApprovals([]);
    } finally {
        setIsLoading(false);
    }
};



      const newApprovals = [
        ...erc20Approvals.map((a) => ({
          ...a,
          type: "ERC-20",
          id: `erc20-${a.contract || "unknown"}-${a.spender || "unknown"}`
        })),
        ...erc721Approvals.map((a) => ({
          ...a,
          type: "ERC-721",
          id: `erc721-${a.tokenId || "0"}-${a.spender || CONTRACT_ADDRESSES.MockSpender}`
        })),
        ...erc1155Approvals.map((a) => ({
          ...a,
          type: "ERC-1155",
          id: `erc1155-${a.spender || "unknown"}`
        })),
      ];

      console.log("🟢 Updated Approvals:", newApprovals);
      setApprovals(newApprovals);

    } catch (error) {
      console.error("❌ Error fetching approvals:", error);
      setApprovals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectApproval = (approval) => {
    setSelectedApprovals((prev) =>
      prev.some((a) => a.id === approval.id) ? prev.filter((a) => a.id !== approval.id) : [...prev, approval]
    );
  };

  const handleBatchRevoke = async () => {
    console.log("🚨 Revoking selected approvals...");
    setIsLoading(true);
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();

      const selectedERC20s = selectedApprovals
        .filter((a) => a.type === "ERC-20")
        .map((a) => a.contract);

      if (selectedERC20s.length > 0) {
        await batchRevokeERC20Approvals(selectedERC20s, signer);
      }

      const selectedERC721s = selectedApprovals
        .filter((a) => a.type === "ERC-721")
        .map((a) => a.tokenId);

      if (selectedERC721s.length > 0) {
        await batchRevokeERC721Approvals(wallet, selectedERC721s);
      }

      const selectedERC1155s = selectedApprovals
        .filter((a) => a.type === "ERC-1155")
        .map((a) => a.spender);

      if (selectedERC1155s.length > 0) {
        await batchRevokeERC1155Approvals(selectedERC1155s);
      }

      alert("Batch revocation complete!");
      fetchApprovals();
    } catch (error) {
      console.error("❌ Error in batch revocation:", error);
      alert("Error in batch revocation: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
console.log("🟢 UI Approvals Before Rendering:", approvals.length, approvals);
  return (
    <div className="card shadow-sm mb-4">
<div className="card-header bg-light d-flex justify-content-between align-items-center">
  <h2 className="card-title">Approval Dashboard</h2>
  <button className="btn btn-secondary" onClick={fetchApprovals}>🔄 Refresh Approvals</button>
</div>
      <div className="card-body">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading approvals...</span>
            </div>
            <p className="mt-3">Loading approvals...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Select</th>
                    <th>Contract</th>
                    <th>Type</th>
                    <th>Spender</th>
                    <th>Approved Amount/Status</th>
                  </tr>
                </thead>


<tbody>
    {approvals.length > 0 ? (
        approvals.map((approval, index) => (
            <tr key={index}>
                <td>{approval.contract}</td>
                <td>{approval.type}</td>
                <td>{approval.spender}</td>
                <td>{approval.type === "ERC-20" ? approval.amount : approval.isApproved ? "✅ Approved" : "❌ Not Approved"}</td>
            </tr>
        ))
    ) : (
        <tr><td colSpan="5" className="text-center py-4">No approvals found.</td></tr>
    )}
</tbody>

              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalDashboard;

