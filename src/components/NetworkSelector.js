import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setNetwork } from "../store/web3Slice";
import { BrowserProvider } from "ethers";

const supportedNetworks = {
  1: { 
    chainId: "0x1", 
    name: "Ethereum Mainnet", 
    rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY", 
    currency: { name: "Ether", symbol: "ETH", decimals: 18 } 
  },
  1337: {
    chainId: "0x539", 
    name: "Hardhat Local", 
    rpcUrl: "http://127.0.0.1:8545", 
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isLocalNetwork: true
  },
  56: { 
    chainId: "0x38", 
    name: "Binance Smart Chain", 
    rpcUrl: "https://bsc-dataseed.binance.org/", 
    currency: { name: "BNB", symbol: "BNB", decimals: 18 } 
  },
  137: { 
    chainId: "0x89", 
    name: "Polygon", 
    rpcUrl: "https://polygon-rpc.com/", 
    currency: { name: "Matic Token", symbol: "MATIC", decimals: 18 } 
  },
  97: { 
    chainId: "0x61", 
    name: "BSC Testnet", 
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/", 
    currency: { name: "BNB", symbol: "BNB", decimals: 18 } 
  },
};

const NetworkSelector = () => {
  const dispatch = useDispatch();
  const currentNetwork = useSelector((state) => state.web3.network);
  const [loading, setLoading] = useState(false);
  
  const switchNetwork = async (chainId) => {
    const networkId = parseInt(chainId, 10);
    console.warn(`⚠️ Simulating network switch to ${supportedNetworks[networkId].name}`);
    dispatch(setNetwork(networkId));
    console.log(`✅ Now using ${supportedNetworks[networkId].name}`);
  };

  const getCurrentNetworkName = () => {
    return currentNetwork && supportedNetworks[currentNetwork]
      ? supportedNetworks[currentNetwork].name
      : currentNetwork
        ? `Unknown Network (ID: ${currentNetwork})`
        : "Not Connected";
  };

  return (
    <div className="card my-4">
      <div className="card-header bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Network Selection</h5>
          <div>
            <span className="fw-bold me-2">Current:</span>
            <span className={`badge ${currentNetwork === 1337 ? 'bg-success' : 'bg-secondary'}`}>
              {getCurrentNetworkName()}
            </span>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-4">
            <label htmlFor="networkSelector" className="form-label">Switch Network:</label>
          </div>
          <div className="col-md-8">
            <div className="d-flex">
              <select
                id="networkSelector"
                className="form-select"
                onChange={(e) => switchNetwork(e.target.value)}
                value={currentNetwork || ""}
              >
                <option value="" disabled>Select a network</option>
                {Object.entries(supportedNetworks).map(([id, net]) => (
                  <option key={id} value={id}>
                    {net.name} {net.isLocalNetwork ? '(Local)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkSelector;