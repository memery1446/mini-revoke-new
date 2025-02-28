import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { CONTRACT_ADDRESSES } from "../constants/abis";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/provider";
import { batchRevokeERC20Approvals } from "../utils/batchRevokeUtils";
import { batchRevokeERC721Approvals } from "../utils/nftApprovals";
import { batchRevokeERC1155Approvals } from "../utils/erc1155Approvals";

const ApprovalDashboard = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3.account);
  const approvals = useSelector((state) => state.web3.approvals);
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeResults, setRevokeResults] = useState(null);

  useEffect(() => {
    if (wallet) {
      fetchApprovals();
    }
  }, [wallet]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    setRevokeResults(null);
    console.log("🔄 Starting approval fetch process...");

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("🔍 Wallet Address:", userAddress);

      const tokenContracts = [CONTRACT_ADDRESSES.TK1, CONTRACT_ADDRESSES.TK2];
      console.log("📋 Token contracts to check:", tokenContracts);

      console.log("📡 Fetching ERC-20 approvals...");
      const erc20Approvals = await getERC20Approvals(tokenContracts, userAddress) || [];
      console.log("✅ Raw ERC-20 Approvals Fetched:", erc20Approvals);

      console.log("📡 Fetching ERC-721 approvals...");
      const erc721Approvals = await getERC721Approvals(userAddress) || [];
      console.log("✅ Raw ERC-721 Approvals Fetched:", erc721Approvals);

      console.log("📡 Fetching ERC-1155 approvals...");
      const erc1155Approvals = await getERC1155Approvals(userAddress) || [];
      console.log("✅ Raw ERC-1155 Approvals Fetched:", erc1155Approvals);

      console.log("📊 Approval counts before mapping:");
      console.log("ERC-20:", erc20Approvals.length);
      console.log("ERC-721:", erc721Approvals.length);
      console.log("ERC-1155:", erc1155Approvals.length);

      console.log("🔄 Mapping approval objects...");
      
      const mappedERC20 = erc20Approvals.map((a) => ({
        ...a,
        type: "ERC-20",
        id: `erc20-${a.contract}-${a.spender}`
      }));
      console.log("✅ Mapped ERC-20 approvals:", mappedERC20);
      
      const mappedERC721 = erc721Approvals.map((a) => ({
        ...a,
        type: "ERC-721",
        id: `erc721-${a.contract}-${a.tokenId}-${a.spender}`
      }));
      console.log("✅ Mapped ERC-721 approvals:", mappedERC721);
      
      const mappedERC1155 = erc1155Approvals.map((a) => ({
        ...a,
        type: "ERC-1155",
        id: `erc1155-${a.contract}-${a.spender}`
      }));
      console.log("✅ Mapped ERC-1155 approvals:", mappedERC1155);

      console.log("📊 Mapped approval counts:");
      console.log("ERC-20:", mappedERC20.length);
      console.log("ERC-721:", mappedERC721.length);
      console.log("ERC-1155:", mappedERC1155.length);

      const newApprovals = [
        ...mappedERC20,
        ...mappedERC721,
        ...mappedERC1155
      ];

      console.log("🟢 Final approvals before dispatch:", newApprovals);
      
      dispatch(setApprovals(newApprovals));
    } catch (error) {
      console.error("❌ Error fetching approvals:", error);
      dispatch(setApprovals([]));
    } finally {
      setIsLoading(false);
    }
  };

  // ... (keep the rest of the component code as is)

  return (
    <div className="card shadow-sm mb-4">
      {/* ... (keep the existing JSX) */}
    </div>
  );
};

export default ApprovalDashboard;

