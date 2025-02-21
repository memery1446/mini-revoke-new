import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setNetwork } from "../store/web3Slice";
import { ethers } from "ethers";

const supportedNetworks = {
  1: { 
    chainId: "0x1", 
    name: "Ethereum Mainnet", 
    rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY", 
    currency: { name: "Ether", symbol: "ETH", decimals: 18 } 
  },
  1337: {
    chainId: "0x539", // 1337 in hex
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
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          if (network.chainId !== currentNetwork) {
            dispatch(setNetwork(network.chainId));
          }
        } catch (err) {
          console.error("Failed to check network:", err);
        }
      }
    };
    
    checkNetwork();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        dispatch(setNetwork(parseInt(chainId, 16)));
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, [dispatch, currentNetwork]);

  const switchNetwork = async (hexChainId) => {
    const networkDetails = Object.values(supportedNetworks).find(net => net.chainId === hexChainId);
    
    if (!networkDetails) {
      setError("Network not supported. Please add it manually in MetaMask.");
      return;
    }

    try {
      setIsChanging(true);
      setError(null);
      console.log(`🔄 Attempting to switch to chain: ${hexChainId}`);

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });

      console.log(`✅ Successfully switched to network ${hexChainId}`);
      return;

    } catch (error) {
      console.error("❌ Error switching network:", error);

      if (error.code === 4902) {
        console.log(`➕ Adding network: ${networkDetails.name}`);
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: networkDetails.chainId,
              chainName: networkDetails.name,
              rpcUrls: [networkDetails.rpcUrl],
              nativeCurrency: networkDetails.currency,
              blockExplorerUrls: networkDetails.explorer ? [networkDetails.explorer] : [],
            }],
          });

          console.log(`✅ Network ${networkDetails.name} added successfully!`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await switchNetwork(hexChainId);

        } catch (addError) {
          setError("Failed to add the network. Please try manually in MetaMask.");
          console.error("❌ Failed to add network:", addError);
        }
      } else {
        setError(`Failed to switch network: ${error.message}`);
      }
    } finally {
      setIsChanging(false);
    }
  };

  const getNetworkTag = (id) => {
    const network = supportedNetworks[id];
    if (!network) return null;
    
    if (network.isLocalNetwork) {
      return <span className="badge bg-warning ms-2">Local</span>;
    } else if (id === 1) {
      return <span className="badge bg-primary ms-2">Mainnet</span>;
    } else {
      return <span className="badge bg-secondary ms-2">Testnet</span>;
    }
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
            {getNetworkTag(currentNetwork)}
          </div>
        </div>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button type="button" className="btn-close float-end" onClick={() => setError(null)}></button>
          </div>
        )}
        
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
                value={currentNetwork ? supportedNetworks[currentNetwork]?.chainId : ""}
                disabled={isChanging}
              >
                <option value="" disabled>Select a network</option>
                {Object.entries(supportedNetworks).map(([id, net]) => (
                  <option key={id} value={net.chainId}>
                    {net.name} {net.isLocalNetwork ? '(Local)' : ''}
                  </option>
                ))}
              </select>
              {isChanging && (
                <div className="spinner-border spinner-border-sm ms-2 mt-2" role="status">
                  <span className="visually-hidden">Switching...</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {currentNetwork === 1337 && (
          <div className="alert alert-success mt-3" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            Connected to Hardhat local network. Your contracts are ready to interact with.
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkSelector;

