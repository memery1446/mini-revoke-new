import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAccount, setNetwork, resetWeb3 } from "../store/web3Slice";
import { ethers, BrowserProvider } from "ethers";

const WalletConnect = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const network = useSelector((state) => state.web3.network);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("🔄 Redux Account:", account);
    console.log("🔄 Redux Network:", network);
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
    } catch (error) {
      console.error("❌ Connection error:", error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    console.log("🔌 Disconnecting Wallet...");
    dispatch(resetWeb3());
  };

  return (
    <div className="text-center my-3">
      {account ? (
        <>
          <p className="text-success">✅ Connected: {account}</p>
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