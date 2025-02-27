import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetWeb3 } from "../store/web3Slice";
import { connectWallet, initializeProvider } from "../utils/providerService";

const WalletConnect = () => {
  const dispatch = useDispatch();
  const account = useSelector((state) => state.web3.account);
  const network = useSelector((state) => state.web3.network);
  const [loading, setLoading] = useState(false);

  // Initialize provider when component mounts
  useEffect(() => {
    initializeProvider();
  }, []);

  useEffect(() => {
    console.log("🔄 Redux Account:", account);
    console.log("🔄 Redux Network:", network);
  }, [account, network]);

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      await connectWallet();
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
        <button className="btn btn-success" onClick={handleConnectWallet} disabled={loading}>
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;

