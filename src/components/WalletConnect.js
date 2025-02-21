import React, { useEffect, useState } from "react";
import { Button } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { setAccount, setNetwork, resetWeb3 } from "../store/web3Slice";
import { ethers } from "ethers";

const WalletConnect = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const network = useSelector((state) => state.web3.network);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Hardhat network parameters
  const HARDHAT_CHAIN_ID = "0x539"; // 1337 in hex
  const HARDHAT_NETWORK = {
    chainId: HARDHAT_CHAIN_ID,
    chainName: "Hardhat Local",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18
    }
  };

  useEffect(() => {
    console.log("🔄 Redux Account:", account);
    console.log("🔄 Redux Network:", network);
    
    // Check if connected but on wrong network
    if (account && network !== 1337) {
      setNetworkError(true);
    } else {
      setNetworkError(false);
    }
  }, [account, network]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("❌ MetaMask is required.");
      return;
    }

    try {
      setLoading(true);
      
      // First try to switch to Hardhat network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
      } catch (switchError) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [HARDHAT_NETWORK],
            });
          } catch (addError) {
            console.error("Failed to add Hardhat network", addError);
          }
        }
      }
      
      // Now request accounts
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Check if we're actually on Hardhat
      const network = await provider.getNetwork();
      console.log("Connected to network:", network);
      
      if (network.chainId !== 1337) {
        console.warn("⚠️ Not connected to Hardhat (1337)! Instead on:", network.chainId);
        setNetworkError(true);
      }

      dispatch(setAccount(address));
      dispatch(setNetwork(network.chainId));

      console.log("✅ Redux Updated -> Account:", address);
      console.log("✅ Redux Updated -> Network:", network.chainId);
    } catch (error) {
      console.error("❌ Connection error:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchToHardhat = async () => {
    try {
      setLoading(true);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      dispatch(setNetwork(network.chainId));
      setNetworkError(false);
    } catch (error) {
      console.error("Failed to switch network", error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    console.log("🔌 Disconnecting Wallet...");
    dispatch(resetWeb3());
    setNetworkError(false);
  };

  return (
    <div className="text-center my-3">
      {account ? (
        <>
          <p className="text-success">✅ Connected: {account}</p>
          <p className={network === 1337 ? "text-info" : "text-danger"}>
            🌐 Network: {network} {network !== 1337 && "⚠️"}
          </p>
          
          {networkError && (
            <div className="alert alert-danger">
              <p>Your wallet is connected to the wrong network (should be Hardhat 1337)</p>
              <Button 
                colorScheme="blue" 
                onClick={switchToHardhat} 
                isLoading={loading}
              >
                Switch to Hardhat
              </Button>
            </div>
          )}
          
          <Button colorScheme="red" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </>
      ) : (
        <Button colorScheme="teal" onClick={connectWallet} isLoading={loading}>
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;

