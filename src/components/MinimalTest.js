import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Simple component to test Redux integration
const MinimalTest = () => {
  const dispatch = useDispatch();
  
  // Read from Redux directly
  const approvalsRaw = useSelector(state => state.web3?.approvals);
  
  // Track local status
  const [status, setStatus] = useState('Ready');
  
  // Add test data directly to Redux
  const addTestData = () => {
    setStatus('Adding test data...');
    
    const testApprovals = [
      {
        type: 'ERC-20',
        contract: '0x6b175474e89094c44da98b954eedeac495271d0f',
        spender: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
        asset: 'DAI',
        valueAtRisk: 'Unlimited'
      }
    ];
    
    try {
      // Dispatch directly 
      dispatch({ 
        type: 'web3/setApprovals', 
        payload: testApprovals 
      });
      
      console.log('✅ Dispatched test approval to Redux');
      setStatus('Test data added to Redux');
    } catch (err) {
      console.error('❌ Error dispatching to Redux:', err);
      setStatus(`Error: ${err.message}`);
    }
  };
  
  // Clear all data
  const clearData = () => {
    setStatus('Clearing data...');
    
    try {
      dispatch({ 
        type: 'web3/setApprovals', 
        payload: [] 
      });
      
      console.log('✅ Cleared approvals in Redux');
      setStatus('Data cleared from Redux');
    } catch (err) {
      console.error('❌ Error clearing Redux:', err);
      setStatus(`Error: ${err.message}`);
    }
  };
  
  // Log current Redux state
  const checkRedux = () => {
    console.log('Current Redux state:', window.store?.getState());
    console.log('Approvals in Redux:', approvalsRaw);
    setStatus('Logged Redux state to console');
  };

  return (
    <div className="card shadow-lg mb-4" style={{border: '3px solid #ff5733'}}>
      <div className="card-header bg-warning">
        <h3 className="mb-0">🧪 Minimal Redux Test</h3>
      </div>
      <div className="card-body">
        <p className="mb-3"><strong>Status:</strong> {status}</p>
        
        <div className="mb-3">
          <h5>Redux State Viewer:</h5>
          <pre className="bg-light p-3 border" style={{maxHeight: '150px', overflow: 'auto'}}>
            {JSON.stringify({
              approvalsExists: approvalsRaw !== undefined,
              approvalsIsArray: Array.isArray(approvalsRaw),
              approvalsCount: Array.isArray(approvalsRaw) ? approvalsRaw.length : 'N/A',
              approvalsData: approvalsRaw
            }, null, 2)}
          </pre>
        </div>
        
        <div className="mb-3">
          <h5>Test Controls:</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={addTestData}>
              Add Test Approval
            </button>
            <button className="btn btn-danger" onClick={clearData}>
              Clear Approvals
            </button>
            <button className="btn btn-info" onClick={checkRedux}>
              Log Redux State
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <h5>Approvals Display:</h5>
          {Array.isArray(approvalsRaw) && approvalsRaw.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th>Type</th>
                    <th>Asset</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalsRaw.map((a, idx) => (
                    <tr key={idx}>
                      <td>{a.type || 'Unknown'}</td>
                      <td>{a.asset || 'Unknown Asset'}</td>
                      <td>{a.valueAtRisk || 'Unknown Value'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-warning">
              No approvals found in Redux store
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalTest;

