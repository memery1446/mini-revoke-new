import React, { useState, useEffect } from "react";
import { JsonRpcProvider, BrowserProvider, Contract, isAddress, parseUnits, formatUnits } from "ethers";
import { CONTRACT_ADDRESSES, TOKEN_ABI } from "../constants/abis";

const TokenAllowanceManager = ({ wallet }) => {
  const [spender, setSpender] = useState("");
  const [allowance, setAllowance] = useState(null);
  const [selectedToken, setSelectedToken] = useState(CONTRACT_ADDRESSES.TK1);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Provider Setup
  const provider = window.ethereum
    ? new BrowserProvider(window.ethereum)
    : new JsonRpcProvider("http://127.0.0.1:8545");

  useEffect(() => {
    if (wallet && selectedToken && spender) {
      console.log("🔄 Fetching allowance on component load...");
      checkAllowance();
    }
  }, [wallet, selectedToken, spender]);

  const checkAllowance = async () => {
    try {
      console.log("🔍 Checking allowance...");

      if (!wallet || !selectedToken || !spender) {
        alert("❌ Please ensure wallet is connected and spender is set.");
        return;
      }

      if (!isAddress(spender)) {
        alert("❌ Invalid spender address!");
        return;
      }

      const tokenContract = new Contract(selectedToken, TOKEN_ABI, provider);
      const value = await tokenContract.allowance(wallet, spender);
      setAllowance(formatUnits(value, 18));
      console.log("✅ Allowance fetched:", formatUnits(value, 18));
    } catch (err) {
      console.error("❌ Error fetching allowance:", err);
      alert("❌ Failed to fetch allowance. Please try again.");
    }
  };

  const handleSetAllowance = async () => {
    try {
      if (!customAmount || isNaN(customAmount) || parseFloat(customAmount) <= 0) {
        alert("❌ Please enter a valid amount.");
        return;
      }

      if (!spender || !isAddress(spender)) {
        alert("❌ Please enter a valid spender address.");
        return;
      }

      console.log(`🚀 Approving ${customAmount} tokens for spender...`);
      setLoading(true);

      const signer = await provider.getSigner();
      const tokenContract = new Contract(selectedToken, TOKEN_ABI, signer);

      const tx = await tokenContract.approve(spender, parseUnits(customAmount, 18));
      await tx.wait();

      console.log("✅ Token approval confirmed!");
      checkAllowance();
    } catch (error) {
      console.error("❌ Error setting allowance:", error);
      alert("❌ Transaction failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllowance = async () => {
    try {
      if (!spender || !isAddress(spender)) {
        alert("❌ Please enter a valid spender address.");
        return;
      }

      console.log("🚨 Revoking allowance...");
      setLoading(true);

      const signer = await provider.getSigner();
      const tokenContract = new Contract(selectedToken, TOKEN_ABI, signer);

      const tx = await tokenContract.approve(spender, 0);
      await tx.wait();

      console.log("✅ Allowance revoked!");
      checkAllowance();
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 border rounded bg-light">
      {wallet ? (
        <>
          <h3 className="text-primary">Wallet Connected: {wallet}</h3>
          <select className="form-select my-2" value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)}>
            <option value={CONTRACT_ADDRESSES.TK1}>Test Token 1 (TK1)</option>
            <option value={CONTRACT_ADDRESSES.TK2}>Test Token 2 (TK2)</option>
          </select>

          <input
            type="text"
            className="form-control my-2"
            placeholder="Spender Address"
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
          />

          <button className="btn btn-secondary w-100 my-2" onClick={checkAllowance} disabled={!wallet || !spender}>
            🔄 Refresh Allowance
          </button>

          <input
            type="number"
            className="form-control my-2"
            placeholder="Enter amount to approve"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />

          <button className="btn btn-primary w-100 my-2" onClick={handleSetAllowance} disabled={loading || !spender}>
            {loading ? "Processing..." : "Set Allowance"}
          </button>

          <button className="btn btn-danger w-100 my-2" onClick={handleRevokeAllowance} disabled={loading || !spender}>
            🚨 Revoke Allowance
          </button>

          <p className="fw-bold">Allowance: {allowance !== null ? `${allowance} Tokens` : "N/A"}</p>
        </>
      ) : (
        <p className="text-danger">🔴 Please connect your wallet first.</p>
      )}
    </div>
  );
};

export default TokenAllowanceManager;

