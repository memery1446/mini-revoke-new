import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAccount, setNetwork, resetWeb3 } from "../store/web3Slice";
import { ethers, BrowserProvider } from "ethers";

const WalletConnect = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const network = useSelector((state) => state.web3.network);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const HARDHAT_CHAIN_ID = "0x539"; // 1337 in hex
  const HARDHAT_NETWORK = {
    chainId: HARDHAT_CHAIN_ID,
    chainName: "Hardhat Local",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  };

  useEffect(() => {
    console.log("🔄 Redux Account:", account);
    console.log("🔄 Redux Network:", network);

    if (account && network !== 1337) {
      setNetworkError(true);
    } else {
      setNetworkError(false);
    }
  }, [account, network]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("❌ MetaMask is required. Please install it.");
      return;
    }

    try {
      setLoading(true);

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      console.log("🌐 Connected to network:", network);

      dispatch(setAccount(address));
      dispatch(setNetwork(network.chainId));

      console.log("✅ Redux Updated -> Account:", address);
      console.log("✅ Redux Updated -> Network:", network.chainId);

      if (network.chainId !== 1337) {
        console.warn("⚠️ Not connected to Hardhat (1337)! Instead on:", network.chainId);
        setNetworkError(true);
      }
    } catch (error) {
      console.error("❌ Connection error:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchToHardhat = async () => {
    if (!window.ethereum) {
      alert("❌ MetaMask is required to switch networks.");
      return;
    }

    try {
      setLoading(true);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      dispatch(setNetwork(Number(network.chainId))); // ✅ Convert BigInt to Number

      setNetworkError(false);
      console.log("✅ Successfully switched to Hardhat network.");
    } catch (error) {
      console.error("❌ Failed to switch network:", error);
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
              <button className="btn btn-primary" onClick={switchToHardhat} disabled={loading}>
                {loading ? "Switching..." : "Switch to Hardhat"}
              </button>
            </div>
          )}

          <button className="btn btn-danger" onClick={disconnectWallet}>
            Disconnect
          </button>
        </>
      ) : (
        <button className="btn btn-success" onClick={connectWallet} disabled={loading}>
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
