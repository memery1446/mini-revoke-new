// components/AutoApprovalLoader.js
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getERC20Approvals } from "../utils/erc20Approvals";
import { getERC721Approvals } from "../utils/nftApprovals";
import { getERC1155Approvals } from "../utils/erc1155Approvals";
import { setApprovals } from "../store/web3Slice";
import { getProvider } from "../utils/providerService";

const AutoApprovalLoader = () => {
  const dispatch = useDispatch();
  const wallet = useSelector((state) => state.web3?.account);
  const network = useSelector((state) => state.web3?.network);
  const approvals = useSelector((state) => state.web3?.approvals || []);
  const [isLoading, setIsLoading] = useState(false);
  const [lastWallet, setLastWallet] = useState(null);
  
  const log = (message, data) => {
    console.log(`🔄 AutoLoader: ${message}`, data !== undefined ? data : '');
  };


  const fetchAllApprovals = async () => {
    if (isLoading || !wallet) return;
    
    log(`Fetching approvals for wallet ${wallet}`);
    setIsLoading(true);
    
    try {
      const provider = await getProvider();
      if (!provider) {
        throw new Error("Failed to get provider");
      }
      
      log("Provider ready, fetching approvals...");
      
      // Fetch all types 
      const erc20Approvals = await getERC20Approvals([], wallet, provider);
      log("ERC-20 approvals found:", erc20Approvals.length);
      
      const erc721Approvals = await getERC721Approvals(wallet, provider);
      log("ERC-721 approvals found:", erc721Approvals.length);
      
      const erc1155Approvals = await getERC1155Approvals(wallet, provider);
      log("ERC-1155 approvals found:", erc1155Approvals.length);
      
      // Combine all 
      const allApprovals = [
        ...erc20Approvals, 
        ...erc721Approvals, 
        ...erc1155Approvals
      ];
      
      log(`Total approvals found: ${allApprovals.length}`);
      
      // Only update Redux if we found at least one approval or need to clear existing ones
      if (allApprovals.length > 0 || approvals.length > 0) {
        dispatch(setApprovals(allApprovals));
        log("Updated Redux store with approvals");
      }
      
      // Update last loaded wallet
      setLastWallet(wallet);
    } catch (error) {
      log("Error fetching approvals:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // This effect runs when account or network changes
  useEffect(() => {
    if (wallet && (wallet !== lastWallet || lastWallet === null)) {
      log(`Wallet changed or connected: ${wallet}`);
      fetchAllApprovals();
    }
  }, [wallet, network]); // Dependencies: wallet and network
  
  // Run on component mount if wallet already connected but no approvals
  useEffect(() => {
    const checkInitialState = async () => {
      if (wallet && approvals.length === 0) {
        log("Wallet connected but no approvals, fetching on mount");
        fetchAllApprovals();
      }
    };
    
    checkInitialState();
  }, []); // Empty dependency array - runs once on mount
  
  // Headless component 
  return null;
};

export default AutoApprovalLoader;
