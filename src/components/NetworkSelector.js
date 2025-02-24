import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setNetwork } from "../store/web3Slice";

const isProduction = process.env.NODE_ENV === "production";

// ✅ Ensure all environment variables are correctly prefixed with `REACT_APP_`
const supportedNetworks = {
  1: { 
    chainId: "0x1", 
    name: "Ethereum Mainnet", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_MAINNET_URL,
  },
  11155111: {  
    chainId: "0xaa36a7", 
    name: "Sepolia Testnet", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_SEPOLIA_URL,
  },
  10: {  
    chainId: "0xa", 
    name: "Optimism", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_OPTIMISM_URL, 
  },
  42161: {  
    chainId: "0xa4b1", 
    name: "Arbitrum One", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_ARBITRUM_URL, 
  },
  137: {  
    chainId: "0x89", 
    name: "Polygon", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_POLYGON_URL, 
  },
  56: {  
    chainId: "0x38", 
    name: "Binance Smart Chain", 
    rpcUrl: "https://bsc-dataseed.binance.org/", // ✅ No API Key Needed
  },
  420: {  
    chainId: "0x1a4", 
    name: "Optimism Goerli", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_OPTIMISM_GOERLI_URL, 
  },
  421613: {  
    chainId: "0x66eed", 
    name: "Arbitrum Goerli", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_ARBITRUM_GOERLI_URL, 
  },
  80001: {  
    chainId: "0x13881", 
    name: "Polygon Mumbai", 
    rpcUrl: process.env.REACT_APP_ALCHEMY_POLYGON_MUMBAI_URL, 
  },
};

const NetworkSelector = () => {
  const dispatch = useDispatch();
  const currentNetwork = useSelector((state) => state.web3.network);
  
  const switchNetwork = async (chainId) => {
    const networkId = parseInt(chainId, 10);
    console.warn(`⚠️ Switching to ${supportedNetworks[networkId]?.name || "Unknown Network"}`);
    dispatch(setNetwork(networkId));
    console.log(`✅ Now using ${supportedNetworks[networkId]?.name || "Unknown Network"}`);
  };

  const getCurrentNetworkName = () => {
    if (!currentNetwork) return "Not Connected";
    const network = supportedNetworks[currentNetwork];
    return network ? network.name : `Unknown Network (ID: ${currentNetwork})`;
  };

  return (
    <div className="card my-4">
      <div className="card-header bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Network Selection</h5>
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
                    {net.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <small className="text-muted mt-2 d-block">
          Using {isProduction ? "Alchemy Sepolia" : "Hardhat Local"}
        </small>
      </div>
    </div>
  );
};

export default NetworkSelector;

