import React, { useState } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, isAddress } from 'ethers';

const TOKEN_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string memory)",
  "function decimals() external view returns (uint8)"
];

const ApprovalDebugger = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [spenderAddress, setSpenderAddress] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkApproval = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      if (!isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }
      
      if (!isAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }
      
      if (!isAddress(spenderAddress)) {
        throw new Error('Invalid spender address');
      }
      
      // Use browser's ethereum provider if available
      const provider = window.ethereum 
        ? new BrowserProvider(window.ethereum) 
        : new JsonRpcProvider("https://ethereum-sepolia.publicnode.com");
        
      // Create contract instance
      const contract = new Contract(tokenAddress, TOKEN_ABI, provider);
      
      // Get token info
      let symbol = '';
      let decimals = 18;
      let balance = '0';
      
      try {
        symbol = await contract.symbol();
        decimals = await contract.decimals();
        balance = await contract.balanceOf(walletAddress);
      } catch (err) {
        console.warn('Error fetching token info:', err);
      }
      
      // Check allowance
      const allowance = await contract.allowance(walletAddress, spenderAddress);
      
      setResults({
        allowance: allowance.toString(),
        token: {
          address: tokenAddress,
          symbol,
          decimals,
          balance: balance.toString()
        },
        owner: walletAddress,
        spender: spenderAddress,
        hasApproval: allowance > 0n
      });
      
    } catch (err) {
      console.error('Error checking approval:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Approval Debugger</h2>
      <p className="text-gray-500 mb-4">Check if a specific token has been approved for a spender</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Address</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address (Owner)</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Spender Address</label>
          <input 
            type="text" 
            className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
            value={spenderAddress}
            onChange={(e) => setSpenderAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          onClick={checkApproval}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Approval'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          <p>Error: {error}</p>
        </div>
      )}
      
      {results && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-bold text-lg mb-2">Results</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Token:</span> {results.token.symbol || 'Unknown'} 
              ({results.token.address.substring(0, 6)}...{results.token.address.substring(38)})
            </p>
            <p>
              <span className="font-medium">Owner:</span> {results.owner.substring(0, 6)}...{results.owner.substring(38)}
            </p>
            <p>
              <span className="font-medium">Spender:</span> {results.spender.substring(0, 6)}...{results.spender.substring(38)}
            </p>
            <p>
              <span className="font-medium">Has Approval:</span> {results.hasApproval ? 'Yes ✅' : 'No ❌'}
            </p>
            <p>
              <span className="font-medium">Allowance:</span> {results.allowance}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDebugger;
