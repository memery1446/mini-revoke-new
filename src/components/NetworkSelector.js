import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setNetwork } from "../store/web3Slice";

const supportedNetworks = {
  1: { 
    chainId: "0x1", 
    name: "Ethereum Mainnet Fork", 
    rpcUrl: "http://127.0.0.1:8545", 
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
    name: "BSC Fork", 
    rpcUrl: "http://127.0.0.1:8545", 
    currency: { name: "BNB", symbol: "BNB", decimals: 18 } 
  },
  137: { 
    chainId: "0x89", 
    name: "Polygon Fork", 
    rpcUrl: "http://127.0.0.1:8545", 
    currency: { name: "Matic Token", symbol: "MATIC", decimals: 18 } 
  },
  97: { 
    chainId: "0x61", 
    name: "BSC Testnet Fork", 
    rpcUrl: "http://127.0.0.1:8545", 
    currency: { name: "BNB", symbol: "BNB", decimals: 18 } 
  },
};

const NetworkSelector = () => {
  const dispatch = useDispatch();
  const currentNetwork = useSelector((state) => state.web3.network);
  
  const switchNetwork = async (chainId) => {
    const networkId = parseInt(chainId, 10);
    console.warn(`⚠️ Switching to ${supportedNetworks[networkId].name} (via Hardhat fork)`);
    dispatch(setNetwork(networkId));
    console.log(`✅ Now using ${supportedNetworks[networkId].name}`);
  };

  const getCurrentNetworkName = () => {
    if (!currentNetwork) return "Not Connected";
    const network = supportedNetworks[currentNetwork];
    if (!network) return `Unknown Network (ID: ${currentNetwork})`;
    return `${network.name} via Hardhat`;
  };

  return (
    <div className="card my-4">
      <div className="card-header bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Forked Network Selection</h5>
          <div>
            <span className="fw-bold me-2">Current:</span>
            <span className="badge bg-success">
              {getCurrentNetworkName()}
            </span>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-4">
            <label htmlFor="networkSelector" className="form-label">Switch Forked Network:</label>
          </div>
          <div className="col-md-8">
            <div className="d-flex">
              <select
                id="networkSelector"
                className="form-select"
                onChange={(e) => switchNetwork(e.target.value)}
                value={currentNetwork || ""}
              >
                <option value="" disabled>Select a network fork</option>
                {Object.entries(supportedNetworks).map(([id, net]) => (
                  <option key={id} value={id}>
                    {net.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <small className="text-muted mt-2 d-block">
          All networks are running via local Hardhat fork at {supportedNetworks[1337].rpcUrl}
        </small>
      </div>
    </div>
  );
};

export default NetworkSelector;
