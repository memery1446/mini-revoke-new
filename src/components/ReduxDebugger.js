import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

/**
 * A simple Redux debugging component
 */
const ReduxDebugger = () => {
  const dispatch = useDispatch();
  const web3State = useSelector(state => state.web3);
  const [lastAction, setLastAction] = useState('None');

  // Add test approvals to Redux
  const addTestApprovals = () => {
    const testApprovals = [
      {
        type: 'ERC-20',
        contract: '0x6b175474e89094c44da98b954eedeac495271d0f',
        spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        asset: 'DAI',
        valueAtRisk: 'Unlimited'
      },
      {
        type: 'ERC-721',
        contract: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        spender: '0x00000000006c3852cbef3e08e8df289169ede581',
        asset: 'BAYC',
        valueAtRisk: 'All NFTs'
      }
    ];
    
    dispatch({ type: 'web3/setApprovals', payload: testApprovals });
    setLastAction('Added test approvals');
    console.log('Test approvals added to Redux', testApprovals);
  };

  // Clear approvals
  const clearApprovals = () => {
    dispatch({ type: 'web3/setApprovals', payload: [] });
    setLastAction('Cleared approvals');
    console.log('Approvals cleared from Redux');
  };
  
  // Log Redux state
  const logReduxState = () => {
    console.log('Current Redux State:', web3State);
    setLastAction('Logged state to console');
  };

  return (
    <div className="card mb-4 border-primary">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Redux Debugger</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <h6>Redux State:</h6>
          <div className="bg-light p-2 mb-2 rounded">
            <div><strong>Account:</strong> {web3State?.account || 'Not connected'}</div>
            <div><strong>Network:</strong> {web3State?.network || 'Not set'}</div>
            <div>
              <strong>Approvals:</strong> {web3State?.approvals ? 
                (Array.isArray(web3State.approvals) ? 
                  `${web3State.approvals.length} items` : 
                  'Not an array') : 
                'None'}
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-2 mb-3">
          <button 
            className="btn btn-success" 
            onClick={addTestApprovals}
          >
            Add Test Approvals
          </button>
          <button 
            className="btn btn-danger" 
            onClick={clearApprovals}
          >
            Clear Approvals
          </button>
          <button 
            className="btn btn-info" 
            onClick={logReduxState}
          >
            Log State
          </button>
        </div>

        <div className="text-muted mt-2">
          <small>Last action: {lastAction}</small>
        </div>
      </div>
    </div>
  );
};

export default ReduxDebugger;